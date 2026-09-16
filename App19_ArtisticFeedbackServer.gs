/**
 * @file       App19_ArtisticFeedbackServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Retorno Artístico.
 *   Sensores utilizados: EDA e ECG.
 *
 * @description
 *   Retorno fisiológico em atividades artísticas via EDA + ECG
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ARTISTIC)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: eda_conductance | hrv_ms | valence_axis | arousal_axis | emotion_quadrant | interoceptive_score
 */

var App19_ArtisticFeedbackServer = (function() {
  'use strict';

  var META = {
    id: 'artistic-feedback',
    version: '1.0.0',
    title: 'Retorno Artístico',
    description: 'Retorno fisiológico em atividades artísticas via EDA + ECG',
    sensors: ['EDA', 'ECG'],
    get sheetName() { return Config.SHEET_NAMES.APP_ARTISTIC; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de retorno artístico',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          eda_conductance: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          valence_axis: { type: 'number', required: false },
          arousal_axis: { type: 'number', required: false },
          emotion_quadrant: { type: 'number', required: false },
          interoceptive_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de retorno artístico',
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
        description: 'Calcula indicadores agregados de retorno artístico',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'eda_conductance',
    'hrv_ms',
    'valence_axis',
    'arousal_axis',
    'emotion_quadrant',
    'interoceptive_score'
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
  AppServerRegistry.register(App19_ArtisticFeedbackServer);
}

// Retrocompatibilidade (temporária)
var App_ArtisticFeedback_ = (function() {
  return {
    saveRecord: App19_ArtisticFeedbackServer.saveRecord,
    getRecords: App19_ArtisticFeedbackServer.getRecords,
    getIndicators: App19_ArtisticFeedbackServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('artistic', META.title, App_ArtisticFeedback_);
}
