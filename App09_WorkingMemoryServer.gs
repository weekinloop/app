/**
 * @file       App09_WorkingMemoryServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Memória de Trabalho.
 *   Sensores utilizados: EEG e POG.
 *
 * @description
 *   Avaliação de memória de trabalho via EEG + POG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MEMORY)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: theta_power_frontal | alpha_power | pog_ping_pong_index | working_memory_load | capacity_estimate
 */

var App09_WorkingMemoryServer = (function() {
  'use strict';

  var META = {
    id: 'working-memory',
    version: '1.0.0',
    title: 'Memória de Trabalho',
    description: 'Avaliação de memória de trabalho via EEG + POG',
    sensors: ['EEG', 'POG'],
    get sheetName() { return Config.SHEET_NAMES.APP_MEMORY; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de memória de trabalho',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          theta_power_frontal: { type: 'number', required: false },
          alpha_power: { type: 'number', required: false },
          pog_ping_pong_index: { type: 'number', required: false },
          working_memory_load: { type: 'number', required: false },
          capacity_estimate: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de memória de trabalho',
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
        description: 'Calcula indicadores agregados de memória de trabalho',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'theta_power_frontal',
    'alpha_power',
    'pog_ping_pong_index',
    'working_memory_load',
    'capacity_estimate'
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
  AppServerRegistry.register(App09_WorkingMemoryServer);
}

// Retrocompatibilidade (temporária)
var App_WorkingMemory_ = (function() {
  return {
    saveRecord: App09_WorkingMemoryServer.saveRecord,
    getRecords: App09_WorkingMemoryServer.getRecords,
    getIndicators: App09_WorkingMemoryServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('memory', META.title, App_WorkingMemory_);
}
