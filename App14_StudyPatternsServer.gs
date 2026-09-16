/**
 * @file       App14_StudyPatternsServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Padrões de Estudo.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Identificação de padrões de estudo ineficazes via POG + EEG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_STUDY)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: fixation_duration_ms | linguistic_coherence_eeg | dmn_activity | mind_wandering_flag | intervention_triggered
 */

var App14_StudyPatternsServer = (function() {
  'use strict';

  var META = {
    id: 'study-patterns',
    version: '1.0.0',
    title: 'Padrões de Estudo',
    description: 'Identificação de padrões de estudo ineficazes via POG + EEG',
    sensors: ['POG', 'EEG'],
    get sheetName() { return Config.SHEET_NAMES.APP_STUDY; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de padrões de estudo',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          fixation_duration_ms: { type: 'number', required: false },
          linguistic_coherence_eeg: { type: 'number', required: false },
          dmn_activity: { type: 'number', required: false },
          mind_wandering_flag: { type: 'number', required: false },
          intervention_triggered: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de padrões de estudo',
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
        description: 'Calcula indicadores agregados de padrões de estudo',
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
    'linguistic_coherence_eeg',
    'dmn_activity',
    'mind_wandering_flag',
    'intervention_triggered'
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
  AppServerRegistry.register(App14_StudyPatternsServer);
}

// Retrocompatibilidade (temporária)
var App_StudyPatterns_ = (function() {
  return {
    saveRecord: App14_StudyPatternsServer.saveRecord,
    getRecords: App14_StudyPatternsServer.getRecords,
    getIndicators: App14_StudyPatternsServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('studyPatterns', META.title, App_StudyPatterns_);
}
