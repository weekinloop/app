/**
 * @file       App17_DistractionMicroMomentsServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Micro-momentos de Distração.
 *   Sensores utilizados: POG e EDA e ECG.
 *
 * @description
 *   Detecção de micro-momentos de distração via POG + EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_DISTRACTION)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: pog_gaze_deviation | eda_pre_deviation | hrv_ms | distraction_type | lc_ne_fatigue_index
 */

var App17_DistractionMicroMomentsServer = (function() {
  'use strict';

  var META = {
    id: 'distraction-micromoments',
    version: '1.0.0',
    title: 'Micro-momentos de Distração',
    description: 'Detecção de micro-momentos de distração via POG + EDA + ECG',
    sensors: ['POG', 'EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_DISTRACTION; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de micro-momentos de distração',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          pog_gaze_deviation: { type: 'number', required: false },
          eda_pre_deviation: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          distraction_type: { type: 'number', required: false },
          lc_ne_fatigue_index: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de micro-momentos de distração',
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
        description: 'Calcula indicadores agregados de micro-momentos de distração',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'pog_gaze_deviation',
    'eda_pre_deviation',
    'hrv_ms',
    'distraction_type',
    'lc_ne_fatigue_index'
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
  AppServerRegistry.register(App17_DistractionMicroMomentsServer);
}

// Retrocompatibilidade (temporária)
var App_DistractionMicroMoments_ = (function() {
  return {
    saveRecord: App17_DistractionMicroMomentsServer.saveRecord,
    getRecords: App17_DistractionMicroMomentsServer.getRecords,
    getIndicators: App17_DistractionMicroMomentsServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('distraction', META.title, App_DistractionMicroMoments_);
}
