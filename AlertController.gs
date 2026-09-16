/**
 * @file       AlertController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de alertas pedagógicos em tempo real.
 *   Gera, persiste e gerencia alertas quando métricas biométricas
 *   ultrapassam os limiares personalizados em NeuroConfig.THRESHOLDS.
 *
 * @description
 *   Os alertas são o principal mecanismo de comunicação entre o sistema
 *   biométrico e o professor em sala de aula. Cada alerta é categorizado
 *   por tipo (sobrecarga cognitiva, estresse, ansiedade, dificuldade de
 *   leitura), severidade (info, aviso, crítico) e inclui uma sugestão
 *   de intervenção pedagógica baseada na literatura de neuro-educação.
 *   O professor visualiza os alertas em tempo real no painel AlertsPanel.html
 *   e pode marcá-los como resolvidos após tomar uma ação.
 *
 * ⚠️ REVISÃO HUMANA OBRIGATÓRIA (fundamentos.md 3.3.5.4):
 *   Alertas gerados automaticamente pelo sistema incluem sugestões de intervenção
 *   baseadas em literatura de neuro-educação. Essas sugestões são apresentadas
 *   como RASCUNHOS para revisão pedagógica — NUNCA são aplicadas automaticamente.
 *   Apenas alertas criados por IA via AIService.generate* passam por
 *   HumanReviewService.decorateResult(); alertas de regras determinísticas
 *   (thresholds do NeuroConfig) são considerados pré-aprovados por design,
 *   mas suas SUGESTÕES DE INTERVENÇÃO exigem aprovação humana antes de registro
 *   formal em InterventionController.
 *
 * @integrations
 *   BiometricDataController.gs : Chama createAlert() ao detectar anomalias
 *   SessionController.gs       : Chama analyzeSession() ao encerrar sessão
 *   Code.gs                    : Rotas getAlerts, resolveAlert
 *   Database.gs                : appendRow(), getAll(), updateById()
 *   Config.gs                  : SHEET_NAMES.ALERTS
 *   NeuroConfig.gs             : THRESHOLDS por perfil escolar/idade
 *   AlertsPanel.html           : Exibe alertas em tempo real
 *   InterventionController.gs  : Alertas resolvidos geram registros de intervenção (requer aprovação humana)
 *
 * @alertTypes
 *   EEG_OVERLOAD         : Razão Teta/Alfa elevada (sobrecarga cognitiva)
 *   ECG_STRESS           : HRV baixa (estresse/ansiedade elevada)
 *   EDA_ANXIETY          : Picos de EDA excessivos (ansiedade aguda)
 *   POG_READING_DIFFICULTY : Regressões oculares excessivas (dificuldade leitura)
 *   COMBINED_OVERLOAD    : Combinação de EEG + ECG + EDA (sobrecarga total)
 *   FLOW_STATE           : Estado de fluxo detectado (informativo positivo)
 *
 * @sheetColumns (aba Alertas)
 *   id | student_id | session_id | tipo | severidade | mensagem |
 *   sugestao_intervencao | status | resolvido_por | resolvido_em |
 *   observacao_resolucao | created_at | updated_at
 */

var AlertController = (function() {

  /** Filas de sugestoes por alerta; a primeira opcao e a padrao. */
  var _interventionSuggestionOptions = {
    'EEG_OVERLOAD': [
      { type: 'andaime_cognitivo', text: 'Ofereça andaimes cognitivos externos (rascunho, diagrama). Reduza a complexidade da tarefa.' },
      { type: 'simplificacao_tarefa', text: 'Divida a tarefa em microetapas e reduza estímulos concorrentes por alguns minutos.' }
    ],
    'ECG_STRESS': [
      { type: 'respiracao_diafragmatica', text: 'Proponha exercício de respiração diafragmática (4-7-8). Considere pausa ativa.' },
      { type: 'pausa_ativa', text: 'Faça uma pausa ativa breve com movimento leve e retomada gradual da tarefa.' },
      { type: 'mudanca_metodologia', text: 'Troque temporariamente para uma mediação oral guiada, reduzindo pressão de desempenho.' }
    ],
    'EDA_ANXIETY': [
      { type: 'reforco_positivo', text: 'Reduza a valência ameaçadora da avaliação. Ofereça reforço positivo imediato.' },
      { type: 'pausa_ativa', text: 'Use pausa ativa curta antes de retomar a tarefa avaliativa.' }
    ],
    'POG_READING_DIFFICULTY': [
      { type: 'suporte_fonetico', text: 'Ative perguntas de verificação de compreensão. Ofereça suporte fonético reforçado.' },
      { type: 'andaime_cognitivo', text: 'Use guia visual de linha e leitura compartilhada por trechos curtos.' }
    ],
    'COMBINED_OVERLOAD': [
      { type: 'pausa_ativa', text: 'Intervenção imediata: pausa, atividade de regulação e redução de carga cognitiva.' },
      { type: 'simplificacao_tarefa', text: 'Suspenda a demanda principal por alguns minutos e retome com tarefa simplificada.' }
    ],
    'FLOW_STATE': [
      { type: 'manutencao_desafio', text: 'Estudante em estado de fluxo. Mantenha o desafio atual sem interrupções.' }
    ]
  };

  var _severityMap;

  function getSeverityMap_() {
    if (!_severityMap) {
      _severityMap = {
        'EEG_OVERLOAD'          : Constants.ALERT_SEVERITY.WARNING,
        'ECG_STRESS'            : Constants.ALERT_SEVERITY.WARNING,
        'EDA_ANXIETY'           : Constants.ALERT_SEVERITY.WARNING,
        'POG_READING_DIFFICULTY': Constants.ALERT_SEVERITY.INFO,
        'COMBINED_OVERLOAD'     : Constants.ALERT_SEVERITY.CRITICAL,
        'FLOW_STATE'            : Constants.ALERT_SEVERITY.INFO
      };
    }
    return _severityMap;
  }

  function isKnownAlertType_(tipo) {
    var severityMap = getSeverityMap_();
    return Object.prototype.hasOwnProperty.call(severityMap, tipo) &&
      Object.prototype.hasOwnProperty.call(_interventionSuggestionOptions, tipo);
  }

  function normalizeInterventionText_(value) {
    try {
      return String(value || '').toLowerCase()
        .replace(/[áàãâ]/g, 'a')
        .replace(/[éê]/g, 'e')
        .replace(/[í]/g, 'i')
        .replace(/[óôõ]/g, 'o')
        .replace(/[ú]/g, 'u')
        .replace(/[ç]/g, 'c');
    } catch (error) {
      Logger.log("Erro em normalizeInterventionText_: " + error.message);
      throw error;
    }
  }

  function averageHrv_(records) {
    try {
      var values = (records || []).map(function(record) {
        return Number(record.hrv_ms);
      }).filter(function(value) {
        return isFinite(value);
      });
      return values.length ? Utils.calcMean(values) : null;
    } catch (error) {
      Logger.log("Erro em averageHrv_: " + error.message);
      throw error;
    }
  }

  function hasHrvImprovedAfterIntervention_(studentId, intervention) {
    try {
      var createdAt = intervention.created_at || intervention.CreatedAt || intervention.timestamp || '';
      var interventionTime = Date.parse(createdAt);
      if (!isFinite(interventionTime)) return null;

      var ecgRecords = Database.getAll(Config.SHEET_NAMES.ECG_DATA, { student_id: studentId });
      var before = [];
      var after = [];
      ecgRecords.forEach(function(record) {
        var recordTime = Date.parse(record.timestamp || record.created_at || record.CreatedAt || '');
        if (!isFinite(recordTime)) return;
        if (recordTime < interventionTime) before.push(record);
        if (recordTime >= interventionTime) after.push(record);
      });

      var beforeAverage = averageHrv_(before.slice(-5));
      var afterAverage = averageHrv_(after.slice(0, 5));
      if (beforeAverage === null || afterAverage === null) return null;
      return afterAverage > beforeAverage;
    } catch (error) {
      Logger.log("Erro em hasHrvImprovedAfterIntervention_: " + error.message);
      throw error;
    }
  }

  function wasSuggestionIneffective_(studentId, suggestion, interventions) {
    try {
      var suggestionType = normalizeInterventionText_(suggestion.type);
      var suggestionText = normalizeInterventionText_(suggestion.text);

      return (interventions || []).some(function(intervention) {
        var interventionType = normalizeInterventionText_(intervention.tipo || intervention.type);
        var description = normalizeInterventionText_(intervention.descricao || intervention.description);
        var efficacy = Number(intervention.eficacia_percebida || intervention.eficaciaPercebida || intervention.efficacy);
        var matchesSuggestion = interventionType === suggestionType ||
          description.indexOf(suggestionType) >= 0 ||
          description.indexOf(suggestionText.slice(0, 28)) >= 0;
        if (!matchesSuggestion) return false;

        var ignored = /ignorado|nao aplicado|não aplicado|sem adesao|sem adesão/.test(description);
        var lowEfficacy = isFinite(efficacy) && efficacy <= 2;
        var noHrvImprovement = suggestionType === 'respiracao_diafragmatica' &&
          hasHrvImprovedAfterIntervention_(studentId, intervention) === false;

        return ignored || lowEfficacy || noHrvImprovement;
      });
    } catch (error) {
      Logger.log("Erro em wasSuggestionIneffective_: " + error.message);
      throw error;
    }
  }

  function getInterventionSuggestion_(tipo, studentId) {
    try {
      var options = _interventionSuggestionOptions[tipo];
      if (!options.length) return '';

      var interventions = studentId
        ? Database.getAll(Config.SHEET_NAMES.INTERVENTIONS, { student_id: studentId })
        : [];

      for (var i = 0; i < options.length; i++) {
        if (!wasSuggestionIneffective_(studentId, options[i], interventions)) {
          return options[i].text;
        }
      }

      return options[0].text;
    } catch (error) {
      Logger.log("Erro em getInterventionSuggestion_: " + error.message);
      throw error;
    }
  }

  function getStudentProfileThresholds_(studentId) {
    var student = Database.findById(Config.SHEET_NAMES.STUDENTS, studentId);
    if (!student) return StandardReturn.fail(Constants.ERROR_MESSAGES.notFound('Estudante'));

    var thresholds = NeuroConfig.getThresholdsForStudent(student);
    if (!thresholds.success) {
      LoggerService.warn('AlertController.getStudentProfileThresholds_', thresholds.error, { studentId: studentId });
      return thresholds;
    }

    return thresholds;
  }

  function ensureStudentAccumulator_(studentMap, studentId) {
    if (!studentMap[studentId]) {
      var thresholdValidation = getStudentProfileThresholds_(studentId);
      if (!thresholdValidation.success) {
        studentMap[studentId] = {
          blocked: true,
          error: thresholdValidation.error,
          cognitiveBlockScore: 0,
          scoreEvidence: [],
          eegAlerts: 0,
          ecgAlerts: 0,
          edaAlerts: 0
        };
        return studentMap[studentId];
      }
      studentMap[studentId] = {
        blocked: false,
        thresholds: thresholdValidation.data,
        cognitiveBlockScore: 0,
        scoreEvidence: [],
        eegAlerts: 0,
        ecgAlerts: 0,
        edaAlerts: 0
      };
    }
    return studentMap[studentId];
  }

  function calculateCognitiveBlockScore_(studentState) {
    try {
      var score = 0;
      var evidence = [];

      if (studentState.eegAlerts > 0) {
        score += NeuroConfig.CROSS_SENSOR_SCORE.weights.EEG_OVERLOAD;
        evidence.push('EEG_OVERLOAD');
      }
      if (studentState.ecgAlerts > 0) {
        score += NeuroConfig.CROSS_SENSOR_SCORE.weights.ECG_STRESS;
        evidence.push('ECG_STRESS');
      }
      if (studentState.edaAlerts > 0) {
        score += NeuroConfig.CROSS_SENSOR_SCORE.weights.EDA_ANXIETY;
        evidence.push('EDA_ANXIETY');
      }

      studentState.cognitiveBlockScore = score;
      studentState.scoreEvidence = evidence;
      return score;
    } catch (error) {
      Logger.log("Erro em calculateCognitiveBlockScore_: " + error.message);
      throw error;
    }
  }

  /**
   * Cria e persiste um novo alerta.
   * @param  {string} studentId
   * @param  {string} sessionId
   * @param  {string} tipo
   * @param  {string} mensagem
   * @return {Object} {success, data, error}
   */
  function createAlert(studentId, sessionId, tipo, mensagem) {
    try {
      if (!isKnownAlertType_(tipo)) {
        var errorMessage = Constants.ERROR_MESSAGES.unknownAlertType(tipo || '');
        LoggerService.warn('AlertController.createAlert', errorMessage);
        return StandardReturn.fail(errorMessage);
      }

      var severidade = getSeverityMap_()[tipo];
      var mensagemSanitizada = HtmlSanitizer.escapeText(mensagem);
      var sugestao = HtmlSanitizer.escapeText(getInterventionSuggestion_(tipo, studentId));

      var id = Database.appendRow(Config.SHEET_NAMES.ALERTS, [
        studentId, sessionId, tipo, severidade, mensagemSanitizada, sugestao,
        Constants.ALERT_STATUS.PENDING, '', '', ''
      ]);
      LoggerService.info('AlertController.createAlert', 'Alerta criado: ' + tipo + ' para estudante ' + studentId);
      return StandardReturn.ok({ alertId: id, tipo: tipo, severidade: severidade, sugestao: sugestao });
    } catch (err) {
      return ResponseHandler.error(err, 'AlertController.createAlert');
    }
  }

  /**
   * Analisa todos os dados de uma sessão encerrada e gera alertas consolidados.
   * @param  {string} sessionId
   * @return {Object} {success, data, error}
   */
  function analyzeSession(sessionId) {
    try {
      try {
        // Análise de alertas combinados (ex: EEG_OVERLOAD + ECG_STRESS + EDA_ANXIETY)
        var eegData = Database.getAll(Config.SHEET_NAMES.EEG_DATA, { session_id: sessionId });
        var ecgData = Database.getAll(Config.SHEET_NAMES.ECG_DATA, { session_id: sessionId });
        var edaData = Database.getAll(Config.SHEET_NAMES.EDA_DATA, { session_id: sessionId });

        // Agrupa por estudante
        var studentMap = {};
        eegData.forEach(function(r) {
          var studentState = ensureStudentAccumulator_(studentMap, r.student_id);
          if (studentState.blocked) return;
          if (Number(r.theta_alpha_ratio) > studentState.thresholds.EEG_THETA_ALPHA_MAX) studentState.eegAlerts++;
        });
        ecgData.forEach(function(r) {
          var studentState = ensureStudentAccumulator_(studentMap, r.student_id);
          if (studentState.blocked) return;
          if (Number(r.hrv_ms) < studentState.thresholds.HRV_MIN) studentState.ecgAlerts++;
        });
        edaData.forEach(function(r) {
          var studentState = ensureStudentAccumulator_(studentMap, r.student_id);
          if (studentState.blocked) return;
          if (Number(r.peaks_per_min) > studentState.thresholds.EDA_PEAKS_PER_MIN) studentState.edaAlerts++;
        });

        // Gera alertas combinados para estudantes com múltiplas modalidades alteradas
        var blockedStudents = 0;
        for (var sid in studentMap) {
          var s = studentMap[sid];
          if (s.blocked) {
            blockedStudents++;
            LoggerService.warn('AlertController.analyzeSession', s.error, { studentId: sid, sessionId: sessionId });
            continue;
          }
          var cognitiveBlockScore = calculateCognitiveBlockScore_(s);
          if (cognitiveBlockScore > NeuroConfig.CROSS_SENSOR_SCORE.threshold) {
            createAlert(sid, sessionId, 'COMBINED_OVERLOAD',
              'Risco de Bloqueio Cognitivo: score multimodal ' + cognitiveBlockScore +
              ' (' + s.scoreEvidence.join(' + ') + ') para perfil ' + s.thresholds.label + '.');
          }
        }
        return StandardReturn.ok({
          sessionId: sessionId,
          analyzedStudents: Object.keys(studentMap).length - blockedStudents,
          blockedStudents: blockedStudents
        });
      } catch (err) {
        return ResponseHandler.error(err, 'AlertController.analyzeSession');
      }
    } catch (error) {
      Logger.log("Erro em analyzeSession: " + error.message);
      throw error;
    }
  }

  /**
   * Retorna alertas pendentes com filtros opcionais.
   * @param  {Object} payload  {sessionId?, studentId?, status?}
   * @param  {Object} session
   * @return {Object} {success, data: Array<Alert>, error}
   */
  function getAlerts(payload, session) {
    try {
      try {
        var filters = {};
        if (payload.sessionId)  filters.session_id  = payload.sessionId;
        if (payload.studentId)  filters.student_id  = payload.studentId;
        if (payload.status)     filters.status      = payload.status;
        else                    filters.status      = Constants.ALERT_STATUS.PENDING;
        var alerts = Database.getAll(Config.SHEET_NAMES.ALERTS, filters)
          .map(function(alert) {
            return HtmlSanitizer.sanitizeAlertRecord(alert);
          });
        return ResponseHandler.success(alerts);
      } catch (err) {
        return ResponseHandler.error(err, 'AlertController.getAlerts');
      }
    } catch (error) {
      Logger.log("Erro em getAlerts: " + error.message);
      throw error;
    }
  }

  /**
   * Marca um alerta como resolvido.
   * @param  {Object} payload  {alertId, observacao?}
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function resolve(payload, session) {
    try {
      var existingAlert = Database.findById(Config.SHEET_NAMES.ALERTS, payload.alertId);
      if (!existingAlert) return ResponseHandler.error(Constants.ERROR_MESSAGES.ALERT_NOT_FOUND);

      var oldStatus = existingAlert.status || existingAlert.Status || Constants.ALERT_STATUS.PENDING;
      var observacaoResolucao = HtmlSanitizer.escapeText(payload.observacao || '');
      var ok = Database.updateById(Config.SHEET_NAMES.ALERTS, payload.alertId, {
        status        : Constants.ALERT_STATUS.RESOLVED,
        resolvido_por : session.userId,
        resolvido_em  : new Date().toISOString(),
        observacao_resolucao: observacaoResolucao
      });
      if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.ALERT_NOT_FOUND);

      AuditService.recordStatusChange({
        userId: session.userId,
        action: 'ALERT_STATUS_CHANGE',
        entity: 'ALERTS',
        recordId: payload.alertId,
        oldValue: oldStatus,
        newValue: Constants.ALERT_STATUS.RESOLVED,
        details: {
          sessionId: existingAlert.session_id || existingAlert.sessionId || '',
          studentId: existingAlert.student_id || existingAlert.studentId || '',
          observacao: observacaoResolucao
        }
      });

      return ResponseHandler.success(null);
    } catch (err) {
      return ResponseHandler.error(err, 'AlertController.resolve');
    }
  }

  return { createAlert: createAlert, analyzeSession: analyzeSession, getAlerts: getAlerts, resolve: resolve };

})();

// Legacy alias kept for gradual migration of older calls.
var AlertController_ = AlertController;
