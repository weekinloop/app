/**
 * @file       App03_ADHDRegulationServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Autorregulação TDAH.
 *   Sensores utilizados: EEG e ECG e EDA.
 *
 * @description
 *   Neurofeedback para supressão DMN e aumento Beta frontal com monitoramento de tônus vagal
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ADHD)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: beta_power | dmn_suppression_index | hrv_ms | eda_tonic | regulation_score
 */

var App03_ADHDRegulationServer = (function() {
  'use strict';

  var META = {
    id: 'adhd-regulation',
    version: '1.0.0',
    title: 'Autorregulação TDAH',
    description: 'Neurofeedback para supressão DMN e aumento Beta frontal com monitoramento de tônus vagal',
    sensors: ['EEG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_ADHD; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de autorregulação tdah',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          beta_power: { type: 'number', required: false },
          dmn_suppression_index: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_tonic: { type: 'number', required: false },
          regulation_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de autorregulação tdah',
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
        description: 'Calcula indicadores agregados de autorregulação tdah',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'beta_power',
    'dmn_suppression_index',
    'hrv_ms',
    'eda_tonic',
    'regulation_score'
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
  AppServerRegistry.register(App03_ADHDRegulationServer);
}

// Retrocompatibilidade (temporária)
var App_ADHDRegulation_ = (function() {
  return {
    saveRecord: App03_ADHDRegulationServer.saveRecord,
    getRecords: App03_ADHDRegulationServer.getRecords,
    getIndicators: App03_ADHDRegulationServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('adhd', META.title, App_ADHDRegulation_);
}
