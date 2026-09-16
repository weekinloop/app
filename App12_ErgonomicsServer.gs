/**
 * @file       App12_ErgonomicsServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Ergonomia.
 *   Sensores utilizados: EDA e POG e ECG.
 *
 * @description
 *   Ergonomia e conforto em sala de aula via EDA + POG + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ERGONOMICS)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: eda_orientation_peaks | pog_reflexive_saccades | hrv_ms | allostatic_load_index | environment_score
 */

var App12_ErgonomicsServer = (function() {
  'use strict';

  var META = {
    id: 'ergonomics',
    version: '1.0.0',
    title: 'Ergonomia',
    description: 'Ergonomia e conforto em sala de aula via EDA + POG + ECG',
    sensors: ['EDA', 'POG', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_ERGONOMICS; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de ergonomia',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          eda_orientation_peaks: { type: 'number', required: false },
          pog_reflexive_saccades: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          allostatic_load_index: { type: 'number', required: false },
          environment_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de ergonomia',
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
        description: 'Calcula indicadores agregados de ergonomia',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'eda_orientation_peaks',
    'pog_reflexive_saccades',
    'hrv_ms',
    'allostatic_load_index',
    'environment_score'
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
  AppServerRegistry.register(App12_ErgonomicsServer);
}

// Retrocompatibilidade (temporária)
var App_Ergonomics_ = (function() {
  return {
    saveRecord: App12_ErgonomicsServer.saveRecord,
    getRecords: App12_ErgonomicsServer.getRecords,
    getIndicators: App12_ErgonomicsServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('ergonomics', META.title, App_Ergonomics_);
}
