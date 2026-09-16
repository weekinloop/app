/**
 * @file       BiometricDataController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador central de recebimento, validação e armazenamento dos
 *   dados biométricos enviados pelo Google Colab (notebook.py) via POST.
 *   Gerencia os quatro fluxos de dados: EEG, ECG, EDA e POG.
 *
 * @description
 *   Este é o controlador mais crítico do sistema em termos de volume
 *   de dados. O notebook.py envia pacotes JSON a cada segundo contendo
 *   métricas processadas (não dados brutos) de todos os sensores ativos.
 *   Este controlador valida o payload, distribui os dados para as abas
 *   corretas (DadosEEG, DadosECG, DadosEDA, DadosPOG) e verifica em
 *   tempo real se alguma métrica ultrapassou os limiares personalizados
 *   em NeuroConfig.THRESHOLDS, chamando AlertController quando necessário.
 *
 * @integrations
 *   Code.gs              : Rotas saveBiometric, getBiometric
 *   Database.gs          : appendRow(), getAll() para cada aba de dados
 *   Config.gs            : SHEET_NAMES (EEG, ECG, EDA, POG)
 *   NeuroConfig.gs       : THRESHOLDS por perfil escolar/idade
 *   SessionController.gs : Valida que a sessão está ativa e pertence ao
 *                          profissional antes de salvar
 *   AlertController.gs   : Chamado quando limiares são ultrapassados
 *   Utils.gs             : isAboveThreshold(), isBelowThreshold()
 *   notebook.py          : Origem dos dados (HTTP POST)
 *   LiveMonitoring.html  : Consulta dados em tempo real via polling
 *
 * @payloadSchema (campo "data" do POST action=saveBiometric)
 *   {
 *     sessionId  : string,
 *     studentId  : string,
 *     timestamp  : string ISO 8601,
 *     eeg        : { theta_alpha_ratio, engagement_index, alpha_power, beta_power, theta_power },
 *     ecg        : { hrv_ms, heart_rate_bpm, rr_interval_ms },
 *     eda        : { conductance_us, peaks_per_min, scl_baseline },
 *     pog        : { fixation_duration_ms, regressions_count, saccade_velocity, gaze_x, gaze_y }
 *   }
 *
 * @sheetColumns (aba DadosEEG)
 *   id | session_id | student_id | timestamp (ISO 8601) | theta_alpha_ratio |
 *   engagement_index | alpha_power | beta_power | theta_power | created_at
 *
 * @sheetColumns (aba DadosECG)
 *   id | session_id | student_id | timestamp (ISO 8601) | hrv_ms | heart_rate_bpm |
 *   rr_interval_ms | created_at
 *
 * @sheetColumns (aba DadosEDA)
 *   id | session_id | student_id | timestamp (ISO 8601) | conductance_us |
 *   peaks_per_min | scl_baseline | created_at
 *
 * @sheetColumns (aba DadosPOG)
 *   id | session_id | student_id | timestamp (ISO 8601) | fixation_duration_ms |
 *   regressions_count | saccade_velocity | gaze_x | gaze_y | created_at
 */

var BiometricDataController = (function() {
  var SIGNAL_WINDOW_SECONDS = 5;
  var SIGNAL_REQUIRED_CONSECUTIVE_SAMPLES = 3;
  var SIGNAL_CACHE_TTL_SECONDS = 120;

  function toNumber_(value) {
    try {
      var number = Number(value);
      return isFinite(number) ? number : null;
    } catch (error) {
      Logger.log("Erro em toNumber_: " + error.message);
      throw error;
    }
  }

  function median_(values) {
    try {
      var sorted = values.slice().sort(function(a, b) { return a - b; });
      var middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    } catch (error) {
      Logger.log("Erro em median_: " + error.message);
      throw error;
    }
  }

  function getSignalCache_() {
    try {
      return CacheService.getScriptCache();
    } catch (error) {
      Logger.log("Erro em getSignalCache_: " + error.message);
      throw error;
    }
  }

  function signalCacheKey_(sessionId, studentId, metricKey) {
    try {
      return ['bio-signal', sessionId, studentId, metricKey].join(':');
    } catch (error) {
      Logger.log("Erro em signalCacheKey_: " + error.message);
      throw error;
    }
  }

  function isOutOfThreshold_(value, threshold, direction) {
    if (value === null) return false;
    return direction === 'below' ? value < threshold : value > threshold;
  }

  function evaluateBiometricSignal_(sessionId, studentId, metricKey, rawValue, threshold, direction, timestamp) {
    try {
      var value = toNumber_(rawValue);
      if (value === null || threshold === null || typeof threshold === 'undefined') {
        return { confirmed: false, filteredValue: value, consecutive: 0, secondsOut: 0 };
      }

      var now = Date.parse(timestamp || new Date().toISOString());
      if (!isFinite(now)) now = Date.now();

      var cache = getSignalCache_();
      var cacheKey = signalCacheKey_(sessionId, studentId, metricKey);
      var state = { samples: [], consecutive: 0, outSince: null };
      var cached = cache.get(cacheKey);
      if (cached) {
        try {
          state = JSON.parse(cached);
        } catch (ignored) {
          state = { samples: [], consecutive: 0, outSince: null };
        }
      }

      var windowStart = now - (SIGNAL_WINDOW_SECONDS * 1000);
      state.samples = (state.samples || []).filter(function(sample) {
        return sample && sample.ts >= windowStart;
      });
      state.samples.push({ ts: now, value: value });

      var filteredValue = median_(state.samples.map(function(sample) { return sample.value; }));
      var outOfThreshold = isOutOfThreshold_(filteredValue, threshold, direction);
      state.consecutive = outOfThreshold ? (Number(state.consecutive) || 0) + 1 : 0;
      state.outSince = outOfThreshold ? (state.outSince || now) : null;

      var secondsOut = state.outSince ? (now - state.outSince) / 1000 : 0;
      var confirmed = outOfThreshold && (
        state.consecutive >= SIGNAL_REQUIRED_CONSECUTIVE_SAMPLES ||
        secondsOut >= SIGNAL_WINDOW_SECONDS
      );

      cache.put(cacheKey, JSON.stringify(state), SIGNAL_CACHE_TTL_SECONDS);

      return {
        confirmed: confirmed,
        filteredValue: filteredValue,
        consecutive: state.consecutive,
        secondsOut: secondsOut
      };
    } catch (error) {
      Logger.log("Erro em evaluateBiometricSignal_: " + error.message);
      throw error;
    }
  }

  /**
   * Recebe e persiste um pacote de dados biométricos do Colab.
   * Verifica limiares e dispara alertas se necessário.
   *
   * @param  {Object} payload  Ver @payloadSchema acima
   * @param  {Object} session
   * @return {Object} {success, data: {alerts: []}, error}
   */
  function save(payload, session) {
    try {
      try {
        try {
          try {
            var d = payload.data || payload; // Aceita payload direto ou aninhado
            // FROTA-09: consentimento obrigatório antes de qualquer coleta biométrica
            try { ConsentService.check(d.studentId, 'collect'); } catch (e) {
              if (e.isConsentError) return ResponseHandler.error('Consentimento ausente ou inválido para coleta: ' + e.status, 'CONSENT_REQUIRED');
              throw e;
            }
            var validation = ValidationService.requireSessionAndStudent(d);
            if (!validation.success) return validation;
            var activeSession = SessionController.requireOwnedActiveSession(d, session);
            if (!activeSession.success) return activeSession;

            var ts = DataService.normalizeTimestamp(d.timestamp);
            var alerts = [];
            var student = Database.findById(Config.SHEET_NAMES.STUDENTS, d.studentId);
            var thresholdValidation = NeuroConfig.getThresholdsForStudent(student);
            var thresholds = thresholdValidation.success ? thresholdValidation.data : null;
            if (!thresholdValidation.success) {
              LoggerService.warn('BiometricDataController.save', thresholdValidation.error, {
                studentId: d.studentId,
                sessionId: d.sessionId
              });
            }

            // ── Salva dados EEG ──────────────────────────────────────────────────
            if (d.eeg) {
              var eegSignal = thresholds ? evaluateBiometricSignal_(
                d.sessionId,
                d.studentId,
                'theta_alpha_ratio',
                d.eeg.theta_alpha_ratio,
                thresholds.EEG_THETA_ALPHA_MAX,
                'above',
                ts
              ) : null;
              // CORREÇÃO P20: Preserva valores ausentes como null (não converte para 0)
              Database.appendRow(Config.SHEET_NAMES.EEG_DATA, [
                d.sessionId, d.studentId, ts,
                d.eeg.theta_alpha_ratio  != null ? d.eeg.theta_alpha_ratio  : null,
                d.eeg.engagement_index   != null ? d.eeg.engagement_index   : null,
                d.eeg.alpha_power        != null ? d.eeg.alpha_power        : null,
                d.eeg.beta_power         != null ? d.eeg.beta_power         : null,
                d.eeg.theta_power        != null ? d.eeg.theta_power        : null
              ]);
              // Verifica sobrecarga cognitiva
              if (eegSignal && eegSignal.confirmed) {
                alerts.push(AlertController.createAlert(d.studentId, d.sessionId, 'EEG_OVERLOAD',
                  'Razão Teta/Alfa elevada e persistente: ' + eegSignal.filteredValue.toFixed(2)));
              }
            }

            // ── Salva dados ECG ──────────────────────────────────────────────────
            if (d.ecg) {
              var ecgSignal = thresholds ? evaluateBiometricSignal_(
                d.sessionId,
                d.studentId,
                'hrv_ms',
                d.ecg.hrv_ms,
                thresholds.HRV_MIN,
                'below',
                ts
              ) : null;
              // CORREÇÃO P20: Preserva valores ausentes como null
              Database.appendRow(Config.SHEET_NAMES.ECG_DATA, [
                d.sessionId, d.studentId, ts,
                d.ecg.hrv_ms          != null ? d.ecg.hrv_ms          : null,
                d.ecg.heart_rate_bpm  != null ? d.ecg.heart_rate_bpm  : null,
                d.ecg.rr_interval_ms  != null ? d.ecg.rr_interval_ms  : null
              ]);
              // Verifica estresse elevado (HRV baixa)
              if (ecgSignal && ecgSignal.confirmed) {
                alerts.push(AlertController.createAlert(d.studentId, d.sessionId, 'ECG_STRESS',
                  'HRV baixa e persistente: ' + ecgSignal.filteredValue.toFixed(1) + ' ms'));
              }
            }

            // ── Salva dados EDA ──────────────────────────────────────────────────
            if (d.eda) {
              var edaSignal = thresholds ? evaluateBiometricSignal_(
                d.sessionId,
                d.studentId,
                'peaks_per_min',
                d.eda.peaks_per_min,
                thresholds.EDA_PEAKS_PER_MIN,
                'above',
                ts
              ) : null;
              // CORREÇÃO P20: Preserva valores ausentes como null
              Database.appendRow(Config.SHEET_NAMES.EDA_DATA, [
                d.sessionId, d.studentId, ts,
                d.eda.conductance_us  != null ? d.eda.conductance_us  : null,
                d.eda.peaks_per_min   != null ? d.eda.peaks_per_min   : null,
                d.eda.scl_baseline    != null ? d.eda.scl_baseline    : null
              ]);
              // Verifica ansiedade (picos de EDA elevados)
              if (edaSignal && edaSignal.confirmed) {
                alerts.push(AlertController.createAlert(d.studentId, d.sessionId, 'EDA_ANXIETY',
                  'Picos de EDA persistentes: ' + edaSignal.filteredValue.toFixed(1) + '/min'));
              }
            }

            // ── Salva dados POG ──────────────────────────────────────────────────
            if (d.pog) {
              var pogSignal = thresholds ? evaluateBiometricSignal_(
                d.sessionId,
                d.studentId,
                'regressions_count',
                d.pog.regressions_count,
                thresholds.POG_REGRESSION_MAX,
                'above',
                ts
              ) : null;
              // CORREÇÃO P20: Preserva valores ausentes como null
              Database.appendRow(Config.SHEET_NAMES.POG_DATA, [
                d.sessionId, d.studentId, ts,
                d.pog.fixation_duration_ms != null ? d.pog.fixation_duration_ms : null,
                d.pog.regressions_count    != null ? d.pog.regressions_count    : null,
                d.pog.saccade_velocity     != null ? d.pog.saccade_velocity     : null,
                d.pog.gaze_x               != null ? d.pog.gaze_x               : null,
                d.pog.gaze_y               != null ? d.pog.gaze_y               : null
              ]);
              // Verifica dificuldade de leitura (regressões excessivas)
              if (pogSignal && pogSignal.confirmed) {
                alerts.push(AlertController.createAlert(d.studentId, d.sessionId, 'POG_READING_DIFFICULTY',
                  'Regressões oculares persistentes: ' + pogSignal.filteredValue.toFixed(1)));
              }
            }

            return ResponseHandler.success({
              alerts: alerts,
              thresholdProfile: thresholds ? thresholds.profileKey : null,
              alertsBlocked: !thresholds
            });
          } catch (err) {
            return ResponseHandler.error(err, 'BiometricDataController.save');
          }
        } catch (error) {
          Logger.log("Erro em save: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em save: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em save: " + error.message);
      throw error;
    }
  }

  /**
   * Consulta dados biométricos de uma sessão/estudante.
   * @param  {Object} payload  {sessionId, studentId?, modalidade?, limit?}
   * @param  {Object} session
   * @return {Object} {success, data: {eeg, ecg, eda, pog}, error}
   */
  function query(payload, session) {
    try {
      try {
        var filters = { session_id: payload.sessionId };
        if (payload.studentId) filters.student_id = payload.studentId;

        var result = {};
        var mod = payload.modalidade;

        if (!mod || mod === 'EEG') result.eeg = Database.getAll(Config.SHEET_NAMES.EEG_DATA, filters);
        if (!mod || mod === 'ECG') result.ecg = Database.getAll(Config.SHEET_NAMES.ECG_DATA, filters);
        if (!mod || mod === 'EDA') result.eda = Database.getAll(Config.SHEET_NAMES.EDA_DATA, filters);
        if (!mod || mod === 'POG') result.pog = Database.getAll(Config.SHEET_NAMES.POG_DATA, filters);

        return ResponseHandler.success(result);
      } catch (err) {
        return ResponseHandler.error(err, 'BiometricDataController.query');
      }
    } catch (error) {
      Logger.log("Erro em query: " + error.message);
      throw error;
    }
  }

  return { save: save, query: query };

})();

// Legacy alias kept for gradual migration of older calls.
var BiometricDataController_ = BiometricDataController;
