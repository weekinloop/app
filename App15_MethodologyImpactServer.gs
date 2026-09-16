/**
 * @file       App15_MethodologyImpactServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Impacto de Metodologias.
 *   Sensores utilizados: EEG e EDA e ECG.
 *
 * @description
 *   Avaliação de impacto de metodologias de ensino via EEG + EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_METHODOLOGY)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: neural_sync_index | cardiac_coupling | eda_sync_peaks | methodology_type | engagement_score
 */

var App15_MethodologyImpactServer = (function() {
  'use strict';

  var META = {
    id: 'methodology-impact',
    version: '1.0.0',
    title: 'Impacto de Metodologias',
    description: 'Avaliação de impacto de metodologias de ensino via EEG + EDA + ECG',
    sensors: ['EEG', 'EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_METHODOLOGY; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de impacto de metodologias',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          neural_sync_index: { type: 'number', required: false },
          cardiac_coupling: { type: 'number', required: false },
          eda_sync_peaks: { type: 'number', required: false },
          methodology_type: { type: 'number', required: false },
          engagement_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de impacto de metodologias',
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
        description: 'Calcula indicadores agregados de impacto de metodologias',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'neural_sync_index',
    'cardiac_coupling',
    'eda_sync_peaks',
    'methodology_type',
    'engagement_score'
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
  AppServerRegistry.register(App15_MethodologyImpactServer);
}

// Retrocompatibilidade (temporária)
var App_MethodologyImpact_ = (function() {
  return {
    saveRecord: App15_MethodologyImpactServer.saveRecord,
    getRecords: App15_MethodologyImpactServer.getRecords,
    getIndicators: App15_MethodologyImpactServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('methodology', META.title, App_MethodologyImpact_);
}
