/**
 * @file       App02_MathAnxietyServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Ansiedade Matemática.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Detecta sequestro amigdaliano que comprime memória de trabalho matemática via correlação HRV/EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MATH)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: hrv_ms | eda_peaks | heart_rate_bpm | pre_test_flag | anxiety_score
 */

var App02_MathAnxietyServer = (function() {
  'use strict';

  var META = {
    id: 'math-anxiety',
    version: '1.0.0',
    title: 'Ansiedade Matemática',
    description: 'Detecta sequestro amigdaliano que comprime memória de trabalho matemática via correlação HRV/EDA',
    sensors: ['ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_MATH; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de ansiedade matemática',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          hrv_ms: { type: 'number', required: false },
          eda_peaks: { type: 'number', required: false },
          heart_rate_bpm: { type: 'number', required: false },
          pre_test_flag: { type: 'number', required: false },
          anxiety_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de ansiedade matemática',
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
        description: 'Calcula indicadores agregados de ansiedade matemática',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'hrv_ms',
    'eda_peaks',
    'heart_rate_bpm',
    'pre_test_flag',
    'anxiety_score'
  ];

  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, METRIC_KEYS);
    return DataService.saveRecord(META.sheetName, biometricPayload, {
      logger: '[' + META.id + '.saveRecord]'
    });
  }

  function getRecords(payload, session) {
    return DataService.getRecords(META.sheetName, payload);
  }

  function getIndicators(payload, session) {
    return DataService.getIndicators(META.sheetName, payload);
  }

  return {
    meta: META,
    saveRecord: saveRecord,
    getRecords: getRecords,
    getIndicators: getIndicators
  };
})();

if (typeof AppServerRegistry !== 'undefined') {
  AppServerRegistry.register(App02_MathAnxietyServer);
}

// Retrocompatibilidade (temporária)
var App_MathAnxiety_ = (function() {
  return {
    saveRecord: App02_MathAnxietyServer.saveRecord,
    getRecords: App02_MathAnxietyServer.getRecords,
    getIndicators: App02_MathAnxietyServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('math', META.title, App_MathAnxiety_);
}
