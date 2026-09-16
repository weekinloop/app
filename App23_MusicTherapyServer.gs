/**
 * @file       App23_MusicTherapyServer.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Musicoterapia.
 *   Sensores utilizados: EEG e ECG e EDA.
 *
 * @description
 *   Musicoterapia e foco em matemática via EEG + ECG + EDA
 *
 * @integrations
 *   AppServerRegistry.gs, DataService.gs, BiometricDataController.gs
 *
 * @apiEndpoints
 *   - saveRecord(payload, session)      : Salva registro biométrico
 *   - getRecords(payload, session)       : Consulta registros
 *   - getIndicators(payload, session)    : Calcula indicadores
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MUSIC)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: alpha_parietal | hrv_ms | eda_tonic | music_bpm | music_type | cognitive_performance_score
 */

var App23_MusicTherapyServer = (function() {
  'use strict';

  var META = {
    id: 'music-therapy',
    version: '1.0.0',
    title: 'Musicoterapia',
    description: 'Musicoterapia e foco em matemática via EEG + ECG + EDA',
    sensors: ['EEG', 'ECG', 'EDA'],
    get sheetName() { return Config.SHEET_NAMES.APP_MUSIC; }, // lazy: evita dependencia de ordem de load com Config.gs
    deprecated: false,
    
    authorization: {
      rolesAny: ['admin', 'professor', 'coordenador']
    },
    
    endpoints: {
      saveRecord: {
        method: 'POST',
        requiresSession: true,
        requiresActiveSession: true,
        description: 'Salva registro biométrico de musicoterapia',
        parameters: {
          sessionId: { type: 'string', required: true },
          studentId: { type: 'string', required: true },
          alpha_parietal: { type: 'number', required: false },
          hrv_ms: { type: 'number', required: false },
          eda_tonic: { type: 'number', required: false },
          music_bpm: { type: 'number', required: false },
          music_type: { type: 'number', required: false },
          cognitive_performance_score: { type: 'number', required: false }
        }
      },
      
      getRecords: {
        method: 'GET',
        requiresSession: true,
        description: 'Consulta registros de musicoterapia',
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
        description: 'Calcula indicadores agregados de musicoterapia',
        parameters: {
          studentId: { type: 'string', required: false },
          periodoInicio: { type: 'string', format: 'ISO 8601', required: false },
          periodoFim: { type: 'string', format: 'ISO 8601', required: false }
        }
      }
    }
  };

  var METRIC_KEYS = [
    'alpha_parietal',
    'hrv_ms',
    'eda_tonic',
    'music_bpm',
    'music_type',
    'cognitive_performance_score'
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
  AppServerRegistry.register(App23_MusicTherapyServer);
}

// Retrocompatibilidade (temporária)
var App_MusicTherapy_ = (function() {
  return {
    saveRecord: App23_MusicTherapyServer.saveRecord,
    getRecords: App23_MusicTherapyServer.getRecords,
    getIndicators: App23_MusicTherapyServer.getIndicators
  };
})();

if (typeof AppController !== 'undefined') {
  AppController.register('music', META.title, App_MusicTherapy_);
}
