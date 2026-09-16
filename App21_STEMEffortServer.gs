/**
 * @file       App21_STEMEffortServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Esforço STEM.
 *   Sensores utilizados: EEG e ECG e EDA.
 *
 * @description
 *   Monitoramento de esforço produtivo em STEM via EEG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_STEM)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: theta_power | gamma_bursts | hrv_ms | eda_phasic_recovery | productive_struggle_index | intervention_needed
 */

var App21_STEMEffortServer = (function() {
  'use strict';

  var META = {
    id: 'stem-effort',
    version: '1.0.0',
    title: 'Esforço STEM',
    description: 'Monitoramento de esforço produtivo em STEM via EEG + ECG + EDA',
    sensors: ['EEG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_STEM; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de esforço stem',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          theta_power: { type: 'number', required: false },
          gamma_bursts: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_phasic_recovery: { type: 'number', required: false },
          productive_struggle_index: { type: 'number', required: false },
          intervention_needed: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de esforço stem',
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
        description: 'Calcula indicadores agregados de esforço stem',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'theta_power',
    'gamma_bursts',
    'hrv_ms',
    'eda_phasic_recovery',
    'productive_struggle_index',
    'intervention_needed'
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
  AppServerRegistry.register(App21_STEMEffortServer);
}

// Retrocompatibilidade (temporária)
var App_STEMEffort_ = (function() {
  return {
    saveRecord: App21_STEMEffortServer.saveRecord,
    getRecords: App21_STEMEffortServer.getRecords,
    getIndicators: App21_STEMEffortServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('stem', META.title, App_STEMEffort_);
}
