/**
 * @file       App11_AhaMomentsServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Momentos Eureka.
 *   Sensores utilizados: EEG e EDA e ECG.
 *
 * @description
 *   Monitoramento de momentos Eureka via EEG + EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_AHA)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: gamma_burst_temporal | alpha_preceding | eda_peak | rr_variation | aha_confidence_score
 */

var App11_AhaMomentsServer = (function() {
  'use strict';

  var META = {
    id: 'aha-moments',
    version: '1.0.0',
    title: 'Momentos Eureka',
    description: 'Monitoramento de momentos Eureka via EEG + EDA + ECG',
    sensors: ['EEG', 'EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_AHA; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de momentos eureka',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          gamma_burst_temporal: { type: 'number', required: false },
          alpha_preceding: { type: 'number', required: false },
          eda_peak: { type: 'number', required: false },
          rr_variation: { type: 'number', required: false },
          aha_confidence_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de momentos eureka',
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
        description: 'Calcula indicadores agregados de momentos eureka',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'gamma_burst_temporal',
    'alpha_preceding',
    'eda_peak',
    'rr_variation',
    'aha_confidence_score'
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
  AppServerRegistry.register(App11_AhaMomentsServer);
}

// Retrocompatibilidade (temporária)
var App_AhaMoments_ = (function() {
  return {
    saveRecord: App11_AhaMomentsServer.saveRecord,
    getRecords: App11_AhaMomentsServer.getRecords,
    getIndicators: App11_AhaMomentsServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('ahaMoments', META.title, App_AhaMoments_);
}
