/**
 * @file       App18_CreativeWritingServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Escrita Criativa.
 *   Sensores utilizados: EEG e ECG e EDA.
 *
 * @description
 *   Escrita criativa e fluxo de ideias via EEG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_CREATIVE)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: beta_high_freq_frontal | alpha_frontal | hrv_ms | eda_tonic | block_type | creative_flow_score
 */

var App18_CreativeWritingServer = (function() {
  'use strict';

  var META = {
    id: 'creative-writing',
    version: '1.0.0',
    title: 'Escrita Criativa',
    description: 'Escrita criativa e fluxo de ideias via EEG + ECG + EDA',
    sensors: ['EEG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_CREATIVE; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de escrita criativa',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          beta_high_freq_frontal: { type: 'number', required: false },
          alpha_frontal: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_tonic: { type: 'number', required: false },
          block_type: { type: 'number', required: false },
          creative_flow_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de escrita criativa',
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
        description: 'Calcula indicadores agregados de escrita criativa',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'beta_high_freq_frontal',
    'alpha_frontal',
    'hrv_ms',
    'eda_tonic',
    'block_type',
    'creative_flow_score'
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
  AppServerRegistry.register(App18_CreativeWritingServer);
}

// Retrocompatibilidade (temporária)
var App_CreativeWriting_ = (function() {
  return {
    saveRecord: App18_CreativeWritingServer.saveRecord,
    getRecords: App18_CreativeWritingServer.getRecords,
    getIndicators: App18_CreativeWritingServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('creative', META.title, App_CreativeWriting_);
}
