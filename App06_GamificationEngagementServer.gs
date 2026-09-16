/**
 * @file       App06_GamificationEngagementServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Engajamento em Gamificação.
 *   Sensores utilizados: EEG e EDA e ECG.
 *
 * @description
 *   Avaliação de engajamento em gamificação via EEG + EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_GAMIF)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: eda_value | hrv_ms | alpha_frontal | flow_state | difficulty_level
 */

var App06_GamificationEngagementServer = (function() {
  'use strict';

  var META = {
    id: 'gamification-engagement',
    version: '1.0.0',
    title: 'Engajamento em Gamificação',
    description: 'Avaliação de engajamento em gamificação via EEG + EDA + ECG',
    sensors: ['EEG', 'EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_GAMIF; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de engajamento em gamificação',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          eda_value: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          alpha_frontal: { type: 'number', required: false },
          flow_state: { type: 'number', required: false },
          difficulty_level: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de engajamento em gamificação',
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
        description: 'Calcula indicadores agregados de engajamento em gamificação',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'eda_value',
    'hrv_ms',
    'alpha_frontal',
    'flow_state',
    'difficulty_level'
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
  AppServerRegistry.register(App06_GamificationEngagementServer);
}

// Retrocompatibilidade (temporária)
var App_GamificationEngagement_ = (function() {
  return {
    saveRecord: App06_GamificationEngagementServer.saveRecord,
    getRecords: App06_GamificationEngagementServer.getRecords,
    getIndicators: App06_GamificationEngagementServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('gamification', META.title, App_GamificationEngagement_);
}
