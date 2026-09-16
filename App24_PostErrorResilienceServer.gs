/**
 * @file       App24_PostErrorResilienceServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Resiliência Pós-erro.
 *   Sensores utilizados: EDA e ECG.
 *
 * @description
 *   Avaliação de resiliência pós-erro via EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_RESILIENCE)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: eda_peak_amplitude | eda_extinction_time_s | hrv_recovery_time_s | pe_amplitude | growth_mindset_index | resilience_score
 */

var App24_PostErrorResilienceServer = (function() {
  'use strict';

  var META = {
    id: 'post-error-resilience',
    version: '1.0.0',
    title: 'Resiliência Pós-erro',
    description: 'Avaliação de resiliência pós-erro via EDA + ECG',
    sensors: ['EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_RESILIENCE; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de resiliência pós-erro',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          eda_peak_amplitude: { type: 'number', required: false },
          eda_extinction_time_s: { type: 'number', required: false },
          hrv_recovery_time_s: { type: 'number', required: false },
          pe_amplitude: { type: 'number', required: false },
          growth_mindset_index: { type: 'number', required: false },
          resilience_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de resiliência pós-erro',
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
        description: 'Calcula indicadores agregados de resiliência pós-erro',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'eda_peak_amplitude',
    'eda_extinction_time_s',
    'hrv_recovery_time_s',
    'pe_amplitude',
    'growth_mindset_index',
    'resilience_score'
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
  AppServerRegistry.register(App24_PostErrorResilienceServer);
}

// Retrocompatibilidade (temporária)
var App_PostErrorResilience_ = (function() {
  return {
    saveRecord: App24_PostErrorResilienceServer.saveRecord,
    getRecords: App24_PostErrorResilienceServer.getRecords,
    getIndicators: App24_PostErrorResilienceServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('resilience', META.title, App_PostErrorResilience_);
}
