/**
 * @file       App04_ScienceLabServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Laboratório de Ciências.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Aprendizagem incorporada via observação do próprio ECG/EDA durante experimentos corporais
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_SCIENCE)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: heart_rate_bpm | hrv_ms | eda_conductance | activity_phase | retention_score
 */

var App04_ScienceLabServer = (function() {
  'use strict';

  var META = {
    id: 'science-lab',
    version: '1.0.0',
    title: 'Laboratório de Ciências',
    description: 'Aprendizagem incorporada via observação do próprio ECG/EDA durante experimentos corporais',
    sensors: ['ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_SCIENCE; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de laboratório de ciências',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          heart_rate_bpm: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_conductance: { type: 'number', required: false },
          activity_phase: { type: 'number', required: false },
          retention_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de laboratório de ciências',
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
        description: 'Calcula indicadores agregados de laboratório de ciências',
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
    'activity_phase',
    'retention_score'
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
  AppServerRegistry.register(App04_ScienceLabServer);
}

// Retrocompatibilidade (temporária)
var App_ScienceLab_ = (function() {
  return {
    saveRecord: App04_ScienceLabServer.saveRecord,
    getRecords: App04_ScienceLabServer.getRecords,
    getIndicators: App04_ScienceLabServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('science', META.title, App_ScienceLab_);
}
