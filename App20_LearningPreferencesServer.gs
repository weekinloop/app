/**
 * @file       App20_LearningPreferencesServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Preferências de Aprendizado.
 *   Sensores utilizados: EDA e POG e ECG.
 *
 * @description
 *   Avaliação de preferências de aprendizado via EDA + POG + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_PREFERENCES)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: fixation_duration_ms | eda_engagement | hrv_ms | format_type | processing_depth_score | preferred_channel
 */

var App20_LearningPreferencesServer = (function() {
  'use strict';

  var META = {
    id: 'learning-preferences',
    version: '1.0.0',
    title: 'Preferências de Aprendizado',
    description: 'Avaliação de preferências de aprendizado via EDA + POG + ECG',
    sensors: ['EDA', 'POG', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_PREFERENCES; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de preferências de aprendizado',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          fixation_duration_ms: { type: 'number', required: false },
          eda_engagement: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          format_type: { type: 'number', required: false },
          processing_depth_score: { type: 'number', required: false },
          preferred_channel: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de preferências de aprendizado',
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
        description: 'Calcula indicadores agregados de preferências de aprendizado',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'fixation_duration_ms',
    'eda_engagement',
    'hrv_ms',
    'format_type',
    'processing_depth_score',
    'preferred_channel'
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
  AppServerRegistry.register(App20_LearningPreferencesServer);
}

// Retrocompatibilidade (temporária)
var App_LearningPreferences_ = (function() {
  return {
    saveRecord: App20_LearningPreferencesServer.saveRecord,
    getRecords: App20_LearningPreferencesServer.getRecords,
    getIndicators: App20_LearningPreferencesServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('preferences', META.title, App_LearningPreferences_);
}
