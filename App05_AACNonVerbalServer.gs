/**
 * @file       App05_AACNonVerbalServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Comunicação Aumentativa.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Comunicação aumentativa para alunos não-verbais via POG + EEG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_AAC)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: fixation_target | bereitschaftspotential | frontal_parietal_coherence | intent_confirmed | symbol_selected
 */

var App05_AACNonVerbalServer = (function() {
  'use strict';

  var META = {
    id: 'aac-nonverbal',
    version: '1.0.0',
    title: 'Comunicação Aumentativa',
    description: 'Comunicação aumentativa para alunos não-verbais via POG + EEG',
    sensors: ['POG', 'EEG'],
    get sheetName() { return Config.SHEET_NAMES.APP_AAC; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de comunicação aumentativa',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          fixation_target: { type: 'number', required: false },
          bereitschaftspotential: { type: 'number', required: false },
          frontal_parietal_coherence: { type: 'number', required: false },
          intent_confirmed: { type: 'number', required: false },
          symbol_selected: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de comunicação aumentativa',
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
        description: 'Calcula indicadores agregados de comunicação aumentativa',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'fixation_target',
    'bereitschaftspotential',
    'frontal_parietal_coherence',
    'intent_confirmed',
    'symbol_selected'
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
  AppServerRegistry.register(App05_AACNonVerbalServer);
}

// Retrocompatibilidade (temporária)
var App_AACNonVerbal_ = (function() {
  return {
    saveRecord: App05_AACNonVerbalServer.saveRecord,
    getRecords: App05_AACNonVerbalServer.getRecords,
    getIndicators: App05_AACNonVerbalServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('aac', META.title, App_AACNonVerbal_);
}
