/**
 * @file       App10_MindfulnessServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Mindfulness.
 *   Sensores utilizados: EEG e ECG e EDA.
 *
 * @description
 *   Mindfulness e foco em sala de aula via EEG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MINDFULNESS)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: alpha_occipital | alpha_theta_junction | hrv_ms | eda_conductance | mindfulness_score
 */

var App10_MindfulnessServer = (function() {
  'use strict';

  var META = {
    id: 'mindfulness',
    version: '1.0.0',
    title: 'Mindfulness',
    description: 'Mindfulness e foco em sala de aula via EEG + ECG + EDA',
    sensors: ['EEG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_MINDFULNESS; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de mindfulness',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          alpha_occipital: { type: 'number', required: false },
          alpha_theta_junction: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_conductance: { type: 'number', required: false },
          mindfulness_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de mindfulness',
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
        description: 'Calcula indicadores agregados de mindfulness',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'alpha_occipital',
    'alpha_theta_junction',
    'hrv_ms',
    'eda_conductance',
    'mindfulness_score'
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
  AppServerRegistry.register(App10_MindfulnessServer);
}

// Retrocompatibilidade (temporária)
var App_Mindfulness_ = (function() {
  return {
    saveRecord: App10_MindfulnessServer.saveRecord,
    getRecords: App10_MindfulnessServer.getRecords,
    getIndicators: App10_MindfulnessServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('mindfulness', META.title, App_Mindfulness_);
}
