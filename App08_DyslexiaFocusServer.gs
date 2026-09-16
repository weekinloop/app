/**
 * @file       App08_DyslexiaFocusServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Foco Visual e Dislexia.
 *   Sensores utilizados: POG e ECG e EDA.
 *
 * @description
 *   Treinamento de foco visual em dislexia via POG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_DYSLEXIA)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: fixation_loss_count | corrective_saccades | hrv_ms | eda_peaks | target_speed | stability_score
 */

var App08_DyslexiaFocusServer = (function() {
  'use strict';

  var META = {
    id: 'dyslexia-focus',
    version: '1.0.0',
    title: 'Foco Visual e Dislexia',
    description: 'Treinamento de foco visual em dislexia via POG + ECG + EDA',
    sensors: ['POG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_DYSLEXIA; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de foco visual e dislexia',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          fixation_loss_count: { type: 'number', required: false },
          corrective_saccades: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_peaks: { type: 'number', required: false },
          target_speed: { type: 'number', required: false },
          stability_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de foco visual e dislexia',
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
        description: 'Calcula indicadores agregados de foco visual e dislexia',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'fixation_loss_count',
    'corrective_saccades',
    'hrv_ms',
    'eda_peaks',
    'target_speed',
    'stability_score'
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
  AppServerRegistry.register(App08_DyslexiaFocusServer);
}

// Retrocompatibilidade (temporária)
var App_DyslexiaFocus_ = (function() {
  return {
    saveRecord: App08_DyslexiaFocusServer.saveRecord,
    getRecords: App08_DyslexiaFocusServer.getRecords,
    getIndicators: App08_DyslexiaFocusServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('dyslexia', META.title, App_DyslexiaFocus_);
}
