/**
 * @file       App13_ExpressiveReadingServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Leitura Expressiva.
 *   Sensores utilizados: POG e ECG e EDA.
 *
 * @description
 *   Treinamento de leitura expressiva via POG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_READING_EXP)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: heart_rate_bpm | hrv_ms | eda_conductance | pog_sequential_fixations | performance_anxiety_score
 */

var App13_ExpressiveReadingServer = (function() {
  'use strict';

  var META = {
    id: 'expressive-reading',
    version: '1.0.0',
    title: 'Leitura Expressiva',
    description: 'Treinamento de leitura expressiva via POG + ECG + EDA',
    sensors: ['POG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_READING_EXP; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de leitura expressiva',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          heart_rate_bpm: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_conductance: { type: 'number', required: false },
          pog_sequential_fixations: { type: 'number', required: false },
          performance_anxiety_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de leitura expressiva',
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
        description: 'Calcula indicadores agregados de leitura expressiva',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'heart_rate_bpm',
    'hrv_ms',
    'eda_conductance',
    'pog_sequential_fixations',
    'performance_anxiety_score'
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
  AppServerRegistry.register(App13_ExpressiveReadingServer);
}

// Retrocompatibilidade (temporária)
var App_ExpressiveReading_ = (function() {
  return {
    saveRecord: App13_ExpressiveReadingServer.saveRecord,
    getRecords: App13_ExpressiveReadingServer.getRecords,
    getIndicators: App13_ExpressiveReadingServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('expressive', META.title, App_ExpressiveReading_);
}
