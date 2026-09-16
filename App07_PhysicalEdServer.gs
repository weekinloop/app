/**
 * @file       App07_PhysicalEdServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Educação Física.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Educação física personalizada com zonas BDNF via ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_PHYSICAL)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: heart_rate_bpm | hrv_ms | eda_conductance | fc_zone | hrv30 | bdnf_proxy
 */

var App07_PhysicalEdServer = (function() {
  'use strict';

  var META = {
    id: 'physical-ed',
    version: '1.0.0',
    title: 'Educação Física',
    description: 'Educação física personalizada com zonas BDNF via ECG + EDA',
    sensors: ['ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_PHYSICAL; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de educação física',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          heart_rate_bpm: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_conductance: { type: 'number', required: false },
          fc_zone: { type: 'number', required: false },
          hrv30: { type: 'number', required: false },
          bdnf_proxy: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de educação física',
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
        description: 'Calcula indicadores agregados de educação física',
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
    'fc_zone',
    'hrv30',
    'bdnf_proxy'
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
  AppServerRegistry.register(App07_PhysicalEdServer);
}

// Retrocompatibilidade (temporária)
var App_PhysicalEd_ = (function() {
  return {
    saveRecord: App07_PhysicalEdServer.saveRecord,
    getRecords: App07_PhysicalEdServer.getRecords,
    getIndicators: App07_PhysicalEdServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('physicalEd', META.title, App_PhysicalEd_);
}
