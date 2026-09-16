/**
 * @file       App16_ReactionGamesServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Jogos de Reação.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Jogos de reação e controle de impulsividade via POG + EEG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_REACTION)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: n200_amplitude | n200_latency | p300_amplitude | ssrt_ms | pog_target_accuracy | inhibitory_control_score
 */

var App16_ReactionGamesServer = (function() {
  'use strict';

  var META = {
    id: 'reaction-games',
    version: '1.0.0',
    title: 'Jogos de Reação',
    description: 'Jogos de reação e controle de impulsividade via POG + EEG',
    sensors: ['POG', 'EEG'],
    get sheetName() { return Config.SHEET_NAMES.APP_REACTION; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de jogos de reação',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          n200_amplitude: { type: 'number', required: false },
          n200_latency: { type: 'number', required: false },
          p300_amplitude: { type: 'number', required: false },
          ssrt_ms: { type: 'number', required: false },
          pog_target_accuracy: { type: 'number', required: false },
          inhibitory_control_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de jogos de reação',
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
        description: 'Calcula indicadores agregados de jogos de reação',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'n200_amplitude',
    'n200_latency',
    'p300_amplitude',
    'ssrt_ms',
    'pog_target_accuracy',
    'inhibitory_control_score'
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
  AppServerRegistry.register(App16_ReactionGamesServer);
}

// Retrocompatibilidade (temporária)
var App_ReactionGames_ = (function() {
  return {
    saveRecord: App16_ReactionGamesServer.saveRecord,
    getRecords: App16_ReactionGamesServer.getRecords,
    getIndicators: App16_ReactionGamesServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('reaction', META.title, App_ReactionGames_);
}
