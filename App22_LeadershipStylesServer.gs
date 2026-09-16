/**
 * @file       App22_LeadershipStylesServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Estilos de Liderança.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Identificação de estilos de liderança em grupos via ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_LEADERSHIP)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: hrv_ms | rr_interval_ms | eda_conductance | cardiac_coupling_index | eda_sync_group | leadership_score
 */

var App22_LeadershipStylesServer = (function() {
  'use strict';

  var META = {
    id: 'leadership-styles',
    version: '1.0.0',
    title: 'Estilos de Liderança',
    description: 'Identificação de estilos de liderança em grupos via ECG + EDA',
    sensors: ['ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_LEADERSHIP; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de estilos de liderança',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          hrv_ms: { type: 'number', required: false },
          rr_interval_ms: { type: 'number', required: false },
          eda_conductance: { type: 'number', required: false },
          cardiac_coupling_index: { type: 'number', required: false },
          eda_sync_group: { type: 'number', required: false },
          leadership_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de estilos de liderança',
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
        description: 'Calcula indicadores agregados de estilos de liderança',
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
    'rr_interval_ms',
    'eda_conductance',
    'cardiac_coupling_index',
    'eda_sync_group',
    'leadership_score'
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
  AppServerRegistry.register(App22_LeadershipStylesServer);
}

// Retrocompatibilidade (temporária)
var App_LeadershipStyles_ = (function() {
  return {
    saveRecord: App22_LeadershipStylesServer.saveRecord,
    getRecords: App22_LeadershipStylesServer.getRecords,
    getIndicators: App22_LeadershipStylesServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('leadership', META.title, App_LeadershipStyles_);
}
