/**
 * @file       App01_ReadingFluencyServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Server para Diagnóstico de Fluência de Leitura.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Monitora a razão Teta/Alfa (EEG) e regressões oculares (POG) para detectar
 *   sobrecarga na via fonológica dorsal. Sinaliza necessidade de intervenção
 *   fonética quando POG indica regressões constantes e EEG mostra potência Teta
 *   elevada na região frontoparietal esquerda.
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, AIService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *   - analyzePattern(payload, session)   : Análise de padrão via IA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_READING)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: theta_alpha_ratio | regression_count | fixation_duration_ms | intervention_flag
 */

var App01_ReadingFluencyServer = (function() {
  'use strict';

  // ────────────────────────────────────────────────────────────────────────
  // METADADOS DO SERVER (descoberta, autorização, documentação)
  // ────────────────────────────────────────────────────────────────────────
  
  var META = {
    id: 'reading-fluency',
    version: '1.0.0',
    title: 'Fluência de Leitura',
    description: 'Diagnóstico de Fluência de Leitura via POG e EEG — detecção de sobrecarga fonológica',
    sensors: ['POG', 'EEG'],
    get sheetName() { return Config.SHEET_NAMES.APP_READING; },
    deprecated: false,
    
    authorization: {
      // Quem pode acessar este App?
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de fluência de leitura (POG + EEG)',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          theta_alpha_ratio: { type: 'number', required: true },
          regression_count: { type: 'number', required: true },
          fixation_duration_ms: { type: 'number', required: true },
          intervention_flag: { type: 'boolean', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de fluência de leitura por sessão e/ou estudante',
        parameters: {
          sessionId: { type: 'string', required: false },
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      },
      
      getIndicators: {
        method: 'GET',
        requiresSession: true,
        description: 'Calcula indicadores agregados de fluência de leitura',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      },

      getSubjects: {
        method: 'GET',
        requiresSession: true,
        description: 'Lista participantes pseudonimizados disponíveis na sessão',
        parameters: {
          sessionId: { type: 'string', required: true }
        }
      },
      
      analyzePattern: {
        method: 'POST',
        requiresSession: true,
        requiresAI: true,
        description: 'Análise de padrão de leitura via IA (regressões, fixações, carga cognitiva)',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true }
        }
      }
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // MÉTRICAS ESPECÍFICAS DA APLICAÇÃO
  // ────────────────────────────────────────────────────────────────────────
  
  var METRIC_KEYS = [
    'theta_alpha_ratio',
    'regression_count',
    'fixation_duration_ms',
    'intervention_flag'
  ];

  // ────────────────────────────────────────────────────────────────────────
  // IMPLEMENTAÇÃO DOS ENDPOINTS
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Salva um registro de dados desta aplicação.
   *
   * @param  {Object} payload  Dados biométricos processados de POG e EEG
   * @param  {Object} session  Sessão validada
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, METRIC_KEYS);
    return DataService.saveRecord(META.sheetName, biometricPayload, {
      logger: '[' + META.id + '.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   *
   * @param  {Object} payload  {sessionId?, studentId?, periodoInicio?, periodoFim?}
   * @param  {Object} session  Sessão validada
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(META.sheetName, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   *
   * @param  {Object} payload  {studentId?, periodoInicio?, periodoFim?}
   * @param  {Object} session  Sessão validada
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(META.sheetName, payload, {
      indicatorBuilder: _buildReadingIndicators
    });
  }

  function getSubjects(payload, session) {
    var validation = ValidationService.requireFields(payload || {}, ['sessionId']);
    if (!validation.success) return validation;
    var result = DataService.getRecords(META.sheetName, { sessionId: payload.sessionId });
    if (!result || !result.success) return result;
    var seen = {};
    var subjects = [];
    (result.data || []).forEach(function(record) {
      var id = String(record.student_id || record.studentId || '').trim();
      if (id && !seen[id]) {
        seen[id] = true;
        subjects.push({ id: id, label: 'Participante ' + (subjects.length + 1) });
      }
    });
    return ResponseHandler.success(subjects);
  }

  /**
   * Análise de padrão de leitura via IA.
   *
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session  Sessão validada
   * @return {Object} {success, data: {analysis, recommendations}, error}
   */
  function analyzePattern(payload, session) {
    var validation = ValidationService.requireFields(payload || {}, ['sessionId', 'studentId']);
    if (!validation.success) return validation;
    try {
      ConsentService.check(String(payload.studentId), 'generative');
    } catch (error) {
      if (error && error.isConsentError) {
        return ResponseHandler.error('Consentimento generativo ausente ou inválido para este participante.');
      }
      throw error;
    }
    // Delega ao AIService com contexto específico da aplicação
    return AIService.generateReadingPattern(payload, session);
  }

  // ────────────────────────────────────────────────────────────────────────
  // FUNÇÕES AUXILIARES PRIVADAS
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Constrói indicadores específicos de fluência de leitura.
   *
   * @param  {Array<Object>} records  Registros brutos da planilha
   * @param  {Object} payload         Payload original (para filtros adicionais)
   * @return {Object} Indicadores calculados
   * @private
   */
  function _buildReadingIndicators(records, payload) {
    try {
      if (!records || records.length === 0) {
        return {
          totalRecords: 0,
          avgThetaAlphaRatio: null,
          avgRegressionCount: null,
          avgFixationDuration: null,
          interventionRate: 0,
          trend: 'INSUFICIENTE'
        };
      }

      var thetaAlphaSum = 0;
      var regressionSum = 0;
      var fixationSum = 0;
      var interventionCount = 0;
      var validRecords = 0;

      records.forEach(function(record) {
        var theta = Number(record.theta_alpha_ratio);
        var regression = Number(record.regression_count);
        var fixation = Number(record.fixation_duration_ms);
      
        if (isFinite(theta) && isFinite(regression) && isFinite(fixation)) {
          thetaAlphaSum += theta;
          regressionSum += regression;
          fixationSum += fixation;
          validRecords++;
        }
      
        if (record.intervention_flag === true || record.intervention_flag === 'true' || record.intervention_flag === 1) {
          interventionCount++;
        }
      });

      if (validRecords === 0) {
        return {
          totalRecords: records.length,
          avgThetaAlphaRatio: null,
          avgRegressionCount: null,
          avgFixationDuration: null,
          interventionRate: 0,
          trend: 'INSUFICIENTE'
        };
      }

      var avgTheta = thetaAlphaSum / validRecords;
      var avgRegression = regressionSum / validRecords;
      var avgFixation = fixationSum / validRecords;
      var interventionRate = (interventionCount / records.length) * 100;

      // Classificação de tendência baseada em limiares
      var trend = 'NORMAL';
      if (avgTheta > 2.5 || avgRegression > 3 || avgFixation > 400) {
        trend = 'DIFICULDADE';
      } else if (avgTheta < 1.2 && avgRegression < 1 && avgFixation < 200) {
        trend = 'EXCELENTE';
      }

      return {
        totalRecords: records.length,
        validRecords: validRecords,
        avgThetaAlphaRatio: Math.round(avgTheta * 100) / 100,
        avgRegressionCount: Math.round(avgRegression * 100) / 100,
        avgFixationDuration: Math.round(avgFixation),
        interventionRate: Math.round(interventionRate * 10) / 10,
        trend: trend,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em _buildReadingIndicators: " + error.message);
      throw error;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ────────────────────────────────────────────────────────────────────────
  
  return {
    meta: META,
    saveRecord: saveRecord,
    getRecords: getRecords,
    getIndicators: getIndicators,
    getSubjects: getSubjects,
    analyzePattern: analyzePattern
  };
})();

// ──────────────────────────────────────────────────────────────────────────
// AUTO-REGISTRO NO REGISTRY
// ──────────────────────────────────────────────────────────────────────────

if (typeof AppServerRegistry !== 'undefined') {
  AppServerRegistry.register(App01_ReadingFluencyServer);
}

// ──────────────────────────────────────────────────────────────────────────
// RETROCOMPATIBILIDADE COM AppController (temporária)
// ──────────────────────────────────────────────────────────────────────────

var App_ReadingFluency_ = (function() {
  return {
    saveRecord: App01_ReadingFluencyServer.saveRecord,
    getRecords: App01_ReadingFluencyServer.getRecords,
    getIndicators: App01_ReadingFluencyServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('reading', App01_ReadingFluencyServer.meta.title, App_ReadingFluency_);
}

