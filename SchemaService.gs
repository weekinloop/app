/**
 * @file SchemaService.gs
 * @description Catalogo padronizado de abas e colunas para CRUD do projeto.
 * Mantem compatibilidade com montadores existentes e garante que cada entidade
 * tenha uma aba com cabecalhos minimos antes de operacoes de leitura/escrita.
 */

var PROJECT_SCHEMA_DEFINITIONS = {"ALERTS":{"entity":"ALERTS","sheetName":"Alertas","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_AAC":{"entity":"APP_AAC","sheetName":"App_ComunicacaoAumentativa","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_ADHD":{"entity":"APP_ADHD","sheetName":"App_AutorregulacaoTDAH","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_AHA":{"entity":"APP_AHA","sheetName":"App_MomentosEureka","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_ARTISTIC":{"entity":"APP_ARTISTIC","sheetName":"App_RetornoArtistico","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_CREATIVE":{"entity":"APP_CREATIVE","sheetName":"App_EscritaCriativa","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_DISTRACTION":{"entity":"APP_DISTRACTION","sheetName":"App_MicroDistracoes","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_DYSLEXIA":{"entity":"APP_DYSLEXIA","sheetName":"App_FocoVisualDislexia","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_ERGONOMICS":{"entity":"APP_ERGONOMICS","sheetName":"App_Ergonomia","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_GAMIF":{"entity":"APP_GAMIF","sheetName":"App_EngajamentoGamificacao","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_LEADERSHIP":{"entity":"APP_LEADERSHIP","sheetName":"App_EstilosLideranca","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_MATH":{"entity":"APP_MATH","sheetName":"App_AnsiedadeMatematica","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_MEMORY":{"entity":"APP_MEMORY","sheetName":"App_MemoriaDeTrabalho","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_METHODOLOGY":{"entity":"APP_METHODOLOGY","sheetName":"App_Metodologias","headers":["ID","Timestamp","Level","Action","Entity","RecordID","UserID","Message","Details","CreatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_MINDFULNESS":{"entity":"APP_MINDFULNESS","sheetName":"App_Mindfulness","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_MUSIC":{"entity":"APP_MUSIC","sheetName":"App_Musicoterapia","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_PHYSICAL":{"entity":"APP_PHYSICAL","sheetName":"App_EducacaoFisica","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_PREFERENCES":{"entity":"APP_PREFERENCES","sheetName":"App_PreferenciasAprendizado","headers":["Key","Value","Description","Scope","UpdatedAt","UpdatedBy"],"required":["Key"],"identifier":"Key","source":"Config.gs"},"APP_REACTION":{"entity":"APP_REACTION","sheetName":"App_JogosReacao","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_READING":{"entity":"APP_READING","sheetName":"App_FluenciaLeitura","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_READING_EXP":{"entity":"APP_READING_EXP","sheetName":"App_LeituraExpressiva","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_RESILIENCE":{"entity":"APP_RESILIENCE","sheetName":"App_ResilienciaPosErro","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_SCIENCE":{"entity":"APP_SCIENCE","sheetName":"App_LaboratorioCiencias","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_STEM":{"entity":"APP_STEM","sheetName":"App_EsforcoSTEM","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"APP_STUDY":{"entity":"APP_STUDY","sheetName":"App_PadroesEstudo","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"AUDIT_LOGS":{"entity":"AUDIT_LOGS","sheetName":"Audit_Logs","headers":["ID","Timestamp","Level","Action","Entity","RecordID","UserID","Message","Details","CreatedAt"],"required":["ID"],"identifier":"ID","source":"baseline"},"BIO_SESSIONS":{"entity":"BIO_SESSIONS","sheetName":"SessoesBiometricas","headers":["ID","UserID","SubjectID","StartedAt","EndedAt","Status","Notes","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"CLASSES":{"entity":"CLASSES","sheetName":"Turmas","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"ECG_DATA":{"entity":"ECG_DATA","sheetName":"DadosECG","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"EDA_DATA":{"entity":"EDA_DATA","sheetName":"DadosEDA","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"EEG_DATA":{"entity":"EEG_DATA","sheetName":"DadosEEG","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"GAMIFICATION":{"entity":"GAMIFICATION","sheetName":"Gamificacao","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"INTERVENTIONS":{"entity":"INTERVENTIONS","sheetName":"Intervencoes","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"POG_DATA":{"entity":"POG_DATA","sheetName":"DadosPOG","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"REPORTS":{"entity":"REPORTS","sheetName":"Relatorios","headers":["ID","Title","Type","Period","Status","GeneratedAt","GeneratedBy","Url","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"SENSORS":{"entity":"SENSORS","sheetName":"Sensores","headers":["ID","Name","Description","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"SESSIONS_AUTH":{"entity":"SESSIONS_AUTH","sheetName":"SessoesAuth","headers":["ID","Name","Email","Username","PasswordHash","Role","Status","LastLoginAt","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"SETTINGS":{"entity":"SETTINGS","sheetName":"Settings","headers":["Key","Value","Description","Scope","UpdatedAt","UpdatedBy"],"required":["Key"],"identifier":"Key","source":"baseline"},"STUDENTS":{"entity":"STUDENTS","sheetName":"Estudantes","headers":["ID","Name","Email","Phone","Class","GuardianName","GuardianPhone","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"TEACHERS":{"entity":"TEACHERS","sheetName":"Professores","headers":["ID","Name","Email","Phone","Subject","Status","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"Config.gs"},"USERS":{"entity":"USERS","sheetName":"Users","headers":["ID","Name","Email","Username","PasswordHash","Role","Status","LastLoginAt","CreatedAt","UpdatedAt"],"required":["ID"],"identifier":"ID","source":"baseline"}};

var CODEX_SCHEMA_HEADER_OVERRIDES = {
  AUDIT_LOGS: ["id", "timestamp", "user_id", "action", "entity", "record_id", "old_value", "new_value", "details", "created_at", "updated_at"],
  APP_READING: ["id", "session_id", "student_id", "timestamp", "theta_alpha_ratio", "regression_count", "fixation_duration_ms", "intervention_flag", "created_at", "updated_at"],
  APP_MATH: ["id", "session_id", "student_id", "timestamp", "hrv_ms", "eda_peaks", "heart_rate_bpm", "pre_test_flag", "anxiety_score", "created_at", "updated_at"],
  APP_ADHD: ["id", "session_id", "student_id", "timestamp", "beta_power", "dmn_suppression_index", "hrv_ms", "eda_tonic", "regulation_score", "created_at", "updated_at"],
  APP_SCIENCE: ["id", "session_id", "student_id", "timestamp", "heart_rate_bpm", "hrv_ms", "eda_conductance", "activity_phase", "retention_score", "created_at", "updated_at"],
  APP_AAC: ["id", "session_id", "student_id", "timestamp", "fixation_target", "bereitschaftspotential", "frontal_parietal_coherence", "intent_confirmed", "symbol_selected", "created_at", "updated_at"],
  APP_GAMIF: ["id", "session_id", "student_id", "timestamp", "eda_value", "hrv_ms", "alpha_frontal", "flow_state", "difficulty_level", "created_at", "updated_at"],
  APP_PHYSICAL: ["id", "session_id", "student_id", "timestamp", "heart_rate_bpm", "hrv_ms", "eda_conductance", "fc_zone", "hrv30", "bdnf_proxy", "created_at", "updated_at"],
  APP_DYSLEXIA: ["id", "session_id", "student_id", "timestamp", "fixation_loss_count", "corrective_saccades", "hrv_ms", "eda_peaks", "target_speed", "stability_score", "created_at", "updated_at"],
  APP_MEMORY: ["id", "session_id", "student_id", "timestamp", "theta_power_frontal", "alpha_power", "pog_ping_pong_index", "working_memory_load", "capacity_estimate", "created_at", "updated_at"],
  APP_MINDFULNESS: ["id", "session_id", "student_id", "timestamp", "alpha_occipital", "alpha_theta_junction", "hrv_ms", "eda_conductance", "mindfulness_score", "created_at", "updated_at"],
  APP_AHA: ["id", "session_id", "student_id", "timestamp", "gamma_burst_temporal", "alpha_preceding", "eda_peak", "rr_variation", "aha_confidence_score", "created_at", "updated_at"],
  APP_ERGONOMICS: ["id", "session_id", "student_id", "timestamp", "eda_orientation_peaks", "pog_reflexive_saccades", "hrv_ms", "allostatic_load_index", "environment_score", "created_at", "updated_at"],
  APP_READING_EXP: ["id", "session_id", "student_id", "timestamp", "heart_rate_bpm", "hrv_ms", "eda_conductance", "pog_sequential_fixations", "performance_anxiety_score", "created_at", "updated_at"],
  APP_STUDY: ["id", "session_id", "student_id", "timestamp", "fixation_duration_ms", "linguistic_coherence_eeg", "dmn_activity", "mind_wandering_flag", "intervention_triggered", "created_at", "updated_at"],
  APP_METHODOLOGY: ["id", "session_id", "student_id", "timestamp", "neural_sync_index", "cardiac_coupling", "eda_sync_peaks", "methodology_type", "engagement_score", "created_at", "updated_at"],
  APP_REACTION: ["id", "session_id", "student_id", "timestamp", "n200_amplitude", "n200_latency", "p300_amplitude", "ssrt_ms", "pog_target_accuracy", "inhibitory_control_score", "created_at", "updated_at"],
  APP_DISTRACTION: ["id", "session_id", "student_id", "timestamp", "pog_gaze_deviation", "eda_pre_deviation", "hrv_ms", "distraction_type", "lc_ne_fatigue_index", "created_at", "updated_at"],
  APP_CREATIVE: ["id", "session_id", "student_id", "timestamp", "beta_high_freq_frontal", "alpha_frontal", "hrv_ms", "eda_tonic", "block_type", "creative_flow_score", "created_at", "updated_at"],
  APP_ARTISTIC: ["id", "session_id", "student_id", "timestamp", "eda_conductance", "hrv_ms", "valence_axis", "arousal_axis", "emotion_quadrant", "interoceptive_score", "created_at", "updated_at"],
  APP_PREFERENCES: ["id", "session_id", "student_id", "timestamp", "fixation_duration_ms", "eda_engagement", "hrv_ms", "format_type", "processing_depth_score", "preferred_channel", "created_at", "updated_at"],
  APP_STEM: ["id", "session_id", "student_id", "timestamp", "theta_power", "gamma_bursts", "hrv_ms", "eda_phasic_recovery", "productive_struggle_index", "intervention_needed", "created_at", "updated_at"],
  APP_LEADERSHIP: ["id", "session_id", "student_id", "timestamp", "hrv_ms", "rr_interval_ms", "eda_conductance", "cardiac_coupling_index", "eda_sync_group", "leadership_score", "created_at", "updated_at"],
  APP_MUSIC: ["id", "session_id", "student_id", "timestamp", "alpha_parietal", "hrv_ms", "eda_tonic", "music_bpm", "music_type", "cognitive_performance_score", "created_at", "updated_at"],
  APP_RESILIENCE: ["id", "session_id", "student_id", "timestamp", "eda_peak_amplitude", "eda_extinction_time_s", "hrv_recovery_time_s", "pe_amplitude", "growth_mindset_index", "resilience_score", "created_at", "updated_at"]
};

// Abas reais lidas pelo login deste projeto (aba + colunas na ordem/nomes esperados).
// Usadas por SchemaService.seedSyntheticUsers para gravar os 15 admins onde o login le.
var SYNTHETIC_USERS_LOGIN_SCHEMAS = [
  { sheetName: 'Usuarios', headers: ['ID','Username','Senha','Papel','Ativo'], constants: { Ativo: true } }
];

var SchemaService = (function() {
  function clone_(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      Logger.log("Erro em clone_: " + error.message);
      throw error;
    }
  }

  function normalizeEntityName_(entityName) {
    return String(entityName || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function getSpreadsheet_(options) {
    try {
      options = options || {};
      if (options.spreadsheet) return options.spreadsheet;
      if (options.spreadsheetId) return SpreadsheetApp.openById(options.spreadsheetId);
      if (typeof getSpreadsheetId === 'function') {
        var idFromFunction = getSpreadsheetId();
        if (idFromFunction) return SpreadsheetApp.openById(idFromFunction);
      }
      if (typeof CONFIG !== 'undefined' && CONFIG.SPREADSHEET_ID) {
        return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      }
      if (typeof Config !== 'undefined' && typeof Config.getSpreadsheetId === 'function' && Config.getSpreadsheetId()) {
        return SpreadsheetApp.openById(Config.getSpreadsheetId());
      }
      if (typeof Config !== 'undefined' && Config.SPREADSHEET_ID) {
        return SpreadsheetApp.openById(Config.SPREADSHEET_ID);
      }
      var idFromProperties = typeof Config !== 'undefined' && typeof Config.getProperty === 'function'
        ? (Config.getProperty('SPREADSHEETS_ID') || Config.getProperty('SPREADSHEET_ID'))
        : PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (idFromProperties) return SpreadsheetApp.openById(idFromProperties);
      return getBoundSpreadsheet_();
    } catch (error) {
      Logger.log("Erro em getSpreadsheet_: " + error.message);
      throw error;
    }
  }

  // codex-schema-crud-compat: keep SchemaService aligned with runtime CRUD/config sources.
  function normalizeEntityKey_(value) {
    try {
      return String(value || '')
        .replace(/^DB_/, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
    } catch (error) {
      Logger.log("Erro em normalizeEntityKey_: " + error.message);
      throw error;
    }
  }

  function headersFromStructure_(structure) {
    if (!structure) return [];
    if (Array.isArray(structure)) return structure;
    if (Array.isArray(structure.headers)) return structure.headers;
    if (Array.isArray(structure.columns)) return structure.columns;
    return [];
  }

  function upsertRuntimeSchema_(schemas, entityName, sheetName, headers, source) {
    try {
      var cleanHeaders = (headers || []).filter(function(header, index, arr) {
        return header && arr.indexOf(header) === index;
      });
      if (!sheetName || cleanHeaders.length === 0) return;

      var key = normalizeEntityKey_(entityName || sheetName);
      var existing = schemas[key] || {};
      schemas[key] = {
        entity: existing.entity || key,
        sheetName: sheetName,
        headers: cleanHeaders,
        required: existing.required && existing.required.length ? existing.required : [cleanHeaders[0]],
        identifier: existing.identifier || cleanHeaders[0],
        source: source || existing.source || 'runtime'
      };
    } catch (error) {
      Logger.log("Erro em upsertRuntimeSchema_: " + error.message);
      throw error;
    }
  }

  function applyHeaderOverrides_(schemas) {
    try {
      if (typeof CODEX_SCHEMA_HEADER_OVERRIDES === 'undefined') return;
      Object.keys(CODEX_SCHEMA_HEADER_OVERRIDES).forEach(function(key) {
        var schema = schemas[key];
        if (!schema) return;
        upsertRuntimeSchema_(
          schemas,
          key,
          schema.sheetName,
          CODEX_SCHEMA_HEADER_OVERRIDES[key],
          'CODEX_SCHEMA_HEADER_OVERRIDES'
        );
      });
    } catch (error) {
      LoggerService.warn('SchemaService.applyHeaderOverrides_', 'Compatibilidade de header override ignorada.', error);
    }
  }

  function addDbCoreSchemas_(schemas) {
    try {
      if (typeof DB_Core === 'undefined' || !DB_Core._SCHEMAS) return;
      Object.keys(DB_Core._SCHEMAS).forEach(function(sheetName) {
        upsertRuntimeSchema_(schemas, sheetName, sheetName, DB_Core._SCHEMAS[sheetName], 'DB_Core._SCHEMAS');
      });
    } catch (error) {
      LoggerService.warn('SchemaService.addDbCoreSchemas_', 'Compatibilidade DB_Core ignorada.', error);
    }
  }

  function addSheetStructureSchemas_(schemas) {
    try {
      try {
        if (typeof SHEET_STRUCTURES === 'undefined') return;
        Object.keys(SHEET_STRUCTURES).forEach(function(sheetName) {
          upsertRuntimeSchema_(
            schemas,
            sheetName,
            sheetName,
            headersFromStructure_(SHEET_STRUCTURES[sheetName]),
            'SHEET_STRUCTURES'
          );
        });
      } catch (error) {
        LoggerService.warn('SchemaService.addSheetStructureSchemas_', 'Compatibilidade SHEET_STRUCTURES ignorada.', error);
      }
    } catch (error) {
      Logger.log("Erro em addSheetStructureSchemas_: " + error.message);
      throw error;
    }
  }

  function addConfigGetSheetSchemas_(schemas) {
    try {
      if (typeof Config_getSheet !== 'function') return;
      ['alunos', 'escolas', 'professores', 'usuarios', 'users'].forEach(function(key) {
        try {
          var definition = Config_getSheet(key);
          if (definition && definition.name && definition.headers) {
            upsertRuntimeSchema_(schemas, key, definition.name, definition.headers, 'Config_getSheet');
          }
        } catch (ignored) {}
      });
    } catch (error) {
      LoggerService.warn('SchemaService.addConfigGetSheetSchemas_', 'Compatibilidade Config_getSheet ignorada.', error);
    }
  }

  function addGetSheetNamesSchemas_(schemas) {
    try {
      try {
        if (typeof getSheetNames !== 'function') return;
        var sheetNames = getSheetNames();
        var knownHeaders = {
          ACHIEVEMENTS: ['id', 'name', 'description', 'icon', 'criteria', 'points', 'active', 'created_at', 'updated_at'],
          SCIENTISTS: ['id', 'name', 'area', 'institution', 'short_description', 'full_bio', 'image_url', 'difficulty', 'display_order', 'active', 'created_at', 'updated_at'],
          QUESTS: ['id', 'title', 'description', 'status', 'objectives', 'criteria', 'reward', 'difficulty', 'display_order', 'created_at', 'updated_at'],
          ITEMS: ['id', 'name', 'description', 'type', 'rarity', 'price', 'metadata', 'active', 'created_at', 'updated_at'],
          FEEDBACK: ['id', 'user_id', 'context', 'rating', 'message', 'status', 'created_at', 'updated_at'],
          LEADERBOARD_CONFIG: ['id', 'name', 'metric', 'period', 'rules', 'active', 'created_at', 'updated_at'],
          QUEST_LOG: ['id', 'user_id', 'quest_id', 'status', 'progress', 'score', 'started_at', 'completed_at', 'created_at', 'updated_at']
        };

        Object.keys(sheetNames).forEach(function(key) {
          if (typeof sheetNames[key] !== 'string') return;
          upsertRuntimeSchema_(
            schemas,
            key,
            sheetNames[key],
            knownHeaders[key] || ['id', 'name', 'status', 'created_at', 'updated_at'],
            'getSheetNames'
          );
        });
      } catch (error) {
        LoggerService.warn('SchemaService.addGetSheetNamesSchemas_', 'Compatibilidade getSheetNames ignorada.', error);
      }
    } catch (error) {
      Logger.log("Erro em addGetSheetNamesSchemas_: " + error.message);
      throw error;
    }
  }

  function collectRuntimeSchemas_() {
    var schemas = clone_(PROJECT_SCHEMA_DEFINITIONS);
    applyHeaderOverrides_(schemas);
    addDbCoreSchemas_(schemas);
    addSheetStructureSchemas_(schemas);
    addConfigGetSheetSchemas_(schemas);
    addGetSheetNamesSchemas_(schemas);
    return schemas;
  }

  function getSchema(entityName) {
    try {
      var requestedKey = normalizeEntityKey_(entityName);
      var schemas = collectRuntimeSchemas_();
      var schema = schemas[requestedKey];

      if (!schema) {
        Object.keys(schemas).some(function(key) {
          if (normalizeEntityKey_(schemas[key].sheetName) === requestedKey) {
            schema = schemas[key];
            return true;
          }
          return false;
        });
      }

      if (!schema) {
        throw new Error('Schema nao encontrado para entidade: ' + entityName);
      }
      return clone_(schema);
    } catch (error) {
      Logger.log("Erro em getSchema: " + error.message);
      throw error;
    }
  }

  function getSchemas(options) {
    try {
      options = options || {};
      var schemas = collectRuntimeSchemas_();
      if (!options.asArray) return schemas;
      return Object.keys(schemas).sort().map(function(key) { return schemas[key]; });
    } catch (error) {
      Logger.log("Erro em getSchemas: " + error.message);
      throw error;
    }
  }

  function readHeaders_(sheet) {
    try {
      try {
        if (!sheet || sheet.getLastColumn() === 0) return [];
        return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
          return String(header || '').trim();
        }).filter(Boolean);
      } catch (error) {
        Logger.log("Erro em readHeaders_: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em readHeaders_: " + error.message);
      throw error;
    }
  }

  function ensureHeaders_(sheet, headers) {
    try {
      var current = readHeaders_(sheet);
      var missing = headers.filter(function(header) { return current.indexOf(header) === -1; });
      if (current.length === 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
        return headers;
      }
      if (missing.length > 0) {
        sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
        return current.concat(missing);
      }
      return current;
    } catch (error) {
      Logger.log("Erro em ensureHeaders_: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }

  function ensureSheet(entityName, options) {
    try {
      options = options || {};
      var schema = typeof entityName === 'object' ? entityName : getSchema(entityName);
      var spreadsheet = getSpreadsheet_(options);
      var sheet = spreadsheet.getSheetByName(schema.sheetName);
      var created = false;
      if (!sheet) {
        sheet = spreadsheet.insertSheet(schema.sheetName);
        created = true;
      }
      var headers = ensureHeaders_(sheet, schema.headers || []);
      return {
        success: true,
        data: {
          entity: schema.entity,
          sheetName: schema.sheetName,
          created: created,
          headers: headers
        },
        error: null,
        entity: schema.entity,
        sheetName: schema.sheetName,
        created: created,
        headers: headers
      };
    } catch (error) {
      Logger.log("Erro em ensureSheet: " + error.message);
      throw error;
    }
  }

  function ensureSheetForRecord(entityName, record, options) {
    try {
      var schema = getSchema(entityName);
      var extraHeaders = Object.keys(record || {}).filter(function(key) {
        return schema.headers.indexOf(key) === -1;
      });
      if (extraHeaders.length) {
        schema.headers = schema.headers.concat(extraHeaders);
      }
      return ensureSheet(schema, options);
    } catch (error) {
      Logger.log("Erro em ensureSheetForRecord: " + error.message);
      throw error;
    }
  }

  function ensureAllSheets(options) {
    try {
      options = options || {};
      var schemas = getSchemas({ asArray: true });
      var ensured = schemas.map(function(schema) {
        return ensureSheet(schema, options);
      });
      // codex-auto-seed-admins: popula os 15 admins sinteticos (idempotente; opt-out via options.seedAdminUsers === false).
      if (options.seedAdminUsers !== false) {
        try { 
          seedSyntheticUsers(options); 
        } catch (seedError) {
          Logger.log("Aviso: Falha ao popular usuários sintéticos: " + seedError.message);
        }
      }
      return ensured;
    } catch (error) {
      Logger.log("Erro em ensureAllSheets: " + error.message);
      throw error;
    }
  }

  function validateData(entityName, data) {
    var schema = getSchema(entityName);
    var missing = (schema.required || []).filter(function(field) {
      return data == null || data[field] === undefined || data[field] === null || data[field] === '';
    });
    return {
      valid: missing.length === 0,
      entity: schema.entity,
      missing: missing,
      required: schema.required || [],
      headers: schema.headers || []
    };
  }

  function validateSpreadsheet(options) {
    try {
      options = options || {};
      var spreadsheet = getSpreadsheet_(options);
      return getSchemas({ asArray: true }).map(function(schema) {
        var sheet = spreadsheet.getSheetByName(schema.sheetName);
        if (!sheet) {
          return {
            success: false,
            data: { entity: schema.entity, sheetName: schema.sheetName, missingSheet: true, missingHeaders: schema.headers },
            error: 'Aba ausente: ' + schema.sheetName,
            entity: schema.entity,
            sheetName: schema.sheetName,
            missingSheet: true,
            missingHeaders: schema.headers
          };
        }
        var headers = readHeaders_(sheet);
        var missingHeaders = schema.headers.filter(function(header) { return headers.indexOf(header) === -1; });
        return {
          success: missingHeaders.length === 0,
          data: {
            entity: schema.entity,
            sheetName: schema.sheetName,
            missingSheet: false,
            missingHeaders: missingHeaders
          },
          error: missingHeaders.length === 0 ? null : 'Cabeçalhos ausentes: ' + missingHeaders.join(', '),
          entity: schema.entity,
          sheetName: schema.sheetName,
          missingSheet: false,
          missingHeaders: missingHeaders
        };
      });
    } catch (error) {
      Logger.log("Erro em validateSpreadsheet: " + error.message);
      throw error;
    }
  }

  function getSheet(entityName, options) {
    try {
      var result = ensureSheet(entityName, options || {});
      return getSpreadsheet_(options || {}).getSheetByName(result.sheetName);
    } catch (error) {
      Logger.log("Erro em getSheet: " + error.message);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Usuarios administradores sinteticos (identicos em todos os 22 webapps).
  // Cria o MESMO conjunto de 15 administradores em qualquer projeto, todos com
  // a senha 'admin123' gravada em TEXTO PURO. A insercao e feita via
  // createRecord: usa o createRecord nativo do projeto quando existir; caso
  // contrario usa um createRecord embutido que grava diretamente na aba.
  // ---------------------------------------------------------------------------
  var SYNTHETIC_ADMIN_USERS_PASSWORD = 'admin123';
  var SYNTHETIC_ADMIN_USERS_PREFIX = 'SYN-ADMIN-';
  var SYNTHETIC_ADMIN_USERS_SEED = [
    'Ana Beatriz Carvalho',
    'Bruno Henrique Alves',
    'Carla Regina Souza',
    'Diego Martins Lima',
    'Eduarda Nunes Pereira',
    'Felipe Augusto Rocha',
    'Gabriela Santos Dias',
    'Henrique Oliveira Costa',
    'Isabela Fernandes Melo',
    'Joao Pedro Ribeiro',
    'Larissa Gomes Barros',
    'Marcelo Tavares Pinto',
    'Natalia Cardoso Freitas',
    'Otavio Ramos Teixeira',
    'Patricia Lopes Moreira'
  ];

  function buildSyntheticAdminUsers_() {
    try {
      return SYNTHETIC_ADMIN_USERS_SEED.map(function(name, index) {
        var n = index + 1;
        var pad = (n < 10 ? '0' : '') + n;
        return {
          id: SYNTHETIC_ADMIN_USERS_PREFIX + pad,
          name: name,
          email: 'admin' + pad + '@synthetic.local',
          username: 'admin' + pad,
          role: 'admin',
          status: 'ativo',
          password: SYNTHETIC_ADMIN_USERS_PASSWORD
        };
      });
    } catch (error) {
      Logger.log("Erro em buildSyntheticAdminUsers_: " + error.message);
      throw error;
    }
  }

  function isUserEntitySchema_(schema) {
    try {
      var headers = (schema.headers || []).map(function(header) { return String(header || '').toLowerCase(); });
      var hasSecret = headers.some(function(header) {
        return header.indexOf('password') >= 0 || header.indexOf('senha') >= 0 || header === 'hash';
      });
      var hasIdentity = headers.some(function(header) {
        return header.indexOf('email') >= 0 || header.indexOf('username') >= 0 || header.indexOf('usuario') >= 0 || header.indexOf('login') >= 0;
      });
      return hasSecret && hasIdentity;
    } catch (error) {
      Logger.log("Erro em isUserEntitySchema_: " + error.message);
      throw error;
    }
  }

  function syntheticAdminUserValue_(header, user, nowStr) {
    try {
      var n = String(header || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (!n) return '';
      if (n.indexOf('password') >= 0 || n.indexOf('senha') >= 0 || n === 'hash') return user.password;
      if (n.indexOf('salt') >= 0) return '';
      if (n.indexOf('lastlogin') >= 0 || n.indexOf('ultimo') >= 0) return '';
      if (n.indexOf('username') >= 0 || n.indexOf('usuario') >= 0 || n.indexOf('login') >= 0) return user.username;
      if (n === 'id' || n.indexOf('recordid') >= 0 || n.indexOf('userid') >= 0 || n.indexOf('codigo') >= 0 || n === 'key') return user.id;
      if (n.indexOf('email') >= 0) return user.email;
      if (n.indexOf('fullname') >= 0 || n.indexOf('name') >= 0 || n.indexOf('nome') >= 0) return user.name;
      if (n.indexOf('role') >= 0 || n.indexOf('perfil') >= 0 || n.indexOf('papel') >= 0 || n.indexOf('nivel') >= 0) return user.role;
      if (n.indexOf('status') >= 0 || n.indexOf('situacao') >= 0 || n.indexOf('ativo') >= 0 || n.indexOf('active') >= 0) return user.status;
      if (n.indexOf('updated') >= 0 || n.indexOf('atualizado') >= 0) return nowStr;
      if (n.indexOf('created') >= 0 || n.indexOf('criado') >= 0 || n.indexOf('timestamp') >= 0 || n.indexOf('data') >= 0) return nowStr;
      if (n.indexOf('description') >= 0 || n.indexOf('descricao') >= 0 || n.indexOf('notes') >= 0 || n.indexOf('observ') >= 0 || n.indexOf('message') >= 0) return 'Usuario administrador sintetico';
      if (n.indexOf('phone') >= 0 || n.indexOf('telefone') >= 0) return '';
      return '';
    } catch (error) {
      Logger.log("Erro em syntheticAdminUserValue_: " + error.message);
      throw error;
    }
  }

  function buildUserRecord_(user, headers, nowStr) {
    try {
      var record = {};
      headers.forEach(function(header) {
        record[header] = syntheticAdminUserValue_(header, user, nowStr);
      });
      return record;
    } catch (error) {
      Logger.log("Erro em buildUserRecord_: " + error.message);
      throw error;
    }
  }

  function nativeCreateRecordAvailable_() {
    try { return typeof createRecord === 'function'; } catch (error) { return false; }
  }

  // createRecord embutido: usa o createRecord nativo do projeto quando existir
  // (tentando entidade e depois nome da aba); caso contrario grava direto na aba.
  function seedCreateRecord_(entity, schema, headers, sheet, record) {
    if (nativeCreateRecordAvailable_()) {
      var attempts = [entity, schema.sheetName];
      for (var a = 0; a < attempts.length; a++) {
        try {
          var result = createRecord(attempts[a], record);
          if (!result || result.success !== false) return 'native';
        } catch (ignored) {}
      }
    }
    sheet.appendRow(headers.map(function(header) {
      return record[header] !== undefined ? record[header] : '';
    }));
    return 'embedded';
  }

  function existingUserKeys_(sheet, headers) {
    try {
      var keys = {};
      if (!sheet || sheet.getLastRow() < 2) return keys;
      var idxId = -1, idxEmail = -1, idxUser = -1;
      headers.forEach(function(header, i) {
        var h = String(header || '').toLowerCase();
        if (idxId === -1 && (h === 'id' || h.indexOf('recordid') >= 0)) idxId = i;
        if (idxEmail === -1 && h.indexOf('email') >= 0) idxEmail = i;
        if (idxUser === -1 && (h.indexOf('username') >= 0 || h.indexOf('usuario') >= 0 || h.indexOf('login') >= 0)) idxUser = i;
      });
      var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
      values.forEach(function(row) {
        [idxId, idxEmail, idxUser].forEach(function(idx) {
          if (idx >= 0) {
            var value = String(row[idx] || '').trim().toLowerCase();
            if (value) keys[value] = true;
          }
        });
      });
      return keys;
    } catch (error) {
      Logger.log("Erro em existingUserKeys_: " + error.message);
      throw error;
    }
  }

  function isSyntheticAdminRow_(row) {
    try {
      for (var i = 0; i < row.length; i++) {
        if (String(row[i] || '').indexOf(SYNTHETIC_ADMIN_USERS_PREFIX) === 0) return true;
      }
      return false;
    } catch (error) {
      Logger.log("Erro em isSyntheticAdminRow_: " + error.message);
      throw error;
    }
  }

  function getSyntheticAdminUsers() {
    try {
      return buildSyntheticAdminUsers_().map(function(user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          password: user.password
        };
      });
    } catch (error) {
      Logger.log("Erro em getSyntheticAdminUsers: " + error.message);
      throw error;
    }
  }

  // Reune as abas de usuario do catalogo + as abas reais de login declaradas
  // pelo projeto em SYNTHETIC_USERS_LOGIN_SCHEMAS. Estas tem prioridade e sao
  // gravadas exatamente com os cabecalhos/ordem que o login do projeto espera.
  function syntheticUserTargets_() {
    var loginSchemas = [];
    try {
      if (typeof SYNTHETIC_USERS_LOGIN_SCHEMAS !== 'undefined' && SYNTHETIC_USERS_LOGIN_SCHEMAS) {
        loginSchemas = SYNTHETIC_USERS_LOGIN_SCHEMAS;
      }
    } catch (ignored) {}
    // Se o projeto declarou SYNTHETIC_USERS_LOGIN_SCHEMAS explicitamente, usa
    // SOMENTE eles — evita duplicatas com entidades "Users" do catálogo baseline.
    if (loginSchemas.length > 0) {
      return loginSchemas.map(function(ls) {
        return {
          entity: ls.entity || ls.sheetName,
          sheetName: ls.sheetName,
          headers: ls.headers || [],
          required: [(ls.headers && ls.headers[0]) || 'ID'],
          identifier: (ls.headers && ls.headers[0]) || 'ID',
          constants: ls.constants || {},
          login: true
        };
      });
    }
    return getSchemas({ asArray: true }).filter(isUserEntitySchema_);
  }

  function clearSyntheticUsers(options) {
    try {
      try {
        try {
          options = options || {};
          var summary = [];
          syntheticUserTargets_().forEach(function(schema) {
            var sheet = getSpreadsheet_(options).getSheetByName(schema.sheetName);
            if (!sheet || sheet.getLastRow() < 2) {
              summary.push({ entity: schema.entity, sheetName: schema.sheetName, removed: 0 });
              return;
            }
            var lastColumn = sheet.getLastColumn();
            var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues();
            var keep = values.filter(function(row) { return !isSyntheticAdminRow_(row); });
            var removed = values.length - keep.length;
            if (removed > 0) {
              sheet.getRange(2, 1, values.length, lastColumn).clearContent();
              if (keep.length > 0) {
                sheet.getRange(2, 1, keep.length, lastColumn).setValues(keep);
              }
            }
            summary.push({ entity: schema.entity, sheetName: schema.sheetName, removed: removed });
          });
          return { ok: true, action: 'clear-synthetic-users', sheets: summary };
        } catch (error) {
          Logger.log("Erro em clearSyntheticUsers: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em clearSyntheticUsers: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em clearSyntheticUsers: " + error.message);
      throw error;
    }
  }

  function seedSyntheticUsers(options) {
    try {
      try {
        try {
          options = options || {};
          if (options.reset === true) {
            clearSyntheticUsers(options);
          }
          var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          var users = buildSyntheticAdminUsers_();
          var summary = [];
          syntheticUserTargets_().forEach(function(schema) {
            ensureSheet(schema, options);
            var sheet = getSpreadsheet_(options).getSheetByName(schema.sheetName);
            var headers = readHeaders_(sheet);
            var constants = schema.constants || {};
            var inserted = 0, skipped = 0, via = null;
            if (headers.length) {
              var existing = existingUserKeys_(sheet, headers);
              users.forEach(function(user) {
                var duplicate = existing[user.id.toLowerCase()] || existing[user.email.toLowerCase()] || existing[user.username.toLowerCase()];
                if (duplicate) { skipped++; return; }
                var record = buildUserRecord_(user, headers, nowStr);
                headers.forEach(function(h) { if (constants[h] !== undefined) record[h] = constants[h]; });
                if (schema.login) {
                  sheet.appendRow(headers.map(function(h) { return record[h] !== undefined ? record[h] : ''; }));
                  via = 'login-sheet';
                } else {
                  via = seedCreateRecord_(schema.entity, schema, headers, sheet, record);
                }
                inserted++;
              });
            }
            summary.push({ entity: schema.entity, sheetName: schema.sheetName, inserted: inserted, skipped: skipped, via: via });
          });
          return {
            ok: true,
            action: 'seed-synthetic-users',
            password: SYNTHETIC_ADMIN_USERS_PASSWORD,
            totalUsers: users.length,
            sheets: summary
          };
        } catch (error) {
          Logger.log("Erro em seedSyntheticUsers: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em seedSyntheticUsers: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em seedSyntheticUsers: " + error.message);
      throw error;
    }
  }

  return {
    getSchemas: getSchemas,
    getSchema: getSchema,
    getSheet: getSheet,
    ensureSheet: ensureSheet,
    ensureSheetForRecord: ensureSheetForRecord,
    ensureAllSheets: ensureAllSheets,
    validateData: validateData,
    validateSpreadsheet: validateSpreadsheet,
    seedSyntheticVisualizationData: seedSyntheticVisualizationData,
    seedSyntheticUsers: seedSyntheticUsers,
    clearSyntheticUsers: clearSyntheticUsers
  };
})();

function seedSyntheticAdminUsers(options) {
  return SchemaService.seedSyntheticUsers(options || {});
}

function clearSyntheticAdminUsers(options) {
  return SchemaService.clearSyntheticUsers(options || {});
}

function listSyntheticAdminUsers() {
  return SchemaService.getSyntheticAdminUsers();
}

function runSchemaServiceSetup(options) {
  return SchemaService.ensureAllSheets(options || {});
}

function runSchemaServiceValidation(options) {
  return SchemaService.validateSpreadsheet(options || {});
}

/* FLEET_AI_SCHEMA_V2: estrutura real + fixtures semanticos explicitamente catalogados. */
function restoreAiCrudStructure(options) {
  options = options || {};
  if (typeof SchemaService === 'undefined') throw new Error('SchemaService indisponivel.');
  if (typeof SchemaService.ensureAllSheets === 'function') return SchemaService.ensureAllSheets(options);
  if (typeof SchemaService.ensureAll === 'function') return SchemaService.ensureAll(options);
  if (typeof SchemaService.restore === 'function') return SchemaService.restore(options);
  throw new Error('SchemaService nao expoe restauracao de estrutura.');
}

function seedSyntheticAiData(options) {
  try {
    try {
      options = options || {};
      var ss = options.spreadsheet || getBoundSpreadsheet_();
      var catalog = typeof AI_FIXTURE_CATALOG !== 'undefined' ? AI_FIXTURE_CATALOG : [];
      var summary = [];
      catalog.forEach(function(fixture) {
        var sheet = ss.getSheetByName(fixture.sheetName);
        if (!sheet) sheet = ss.insertSheet(fixture.sheetName);
        var currentHeaders = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
        if (!currentHeaders.length || currentHeaders.every(function(value) { return !value; })) {
          sheet.getRange(1, 1, 1, fixture.headers.length).setValues([fixture.headers]);
          currentHeaders = fixture.headers.slice();
        }
        var sameHeaders = fixture.headers.length === currentHeaders.length &&
          fixture.headers.every(function(header, index) { return String(currentHeaders[index]) === String(header); });
        if (!sameHeaders) {
          if (options.reset === true || sheet.getLastRow() <= 1) {
            sheet.clear();
          }
          sheet.getRange(1, 1, 1, fixture.headers.length).setValues([fixture.headers]);
          currentHeaders = fixture.headers.slice();
          sameHeaders = true;
        }
        var inserted = 0;
        if (options.reset === true && sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        if (sheet.getLastRow() < 2 || options.append === true) {
          sheet.getRange(sheet.getLastRow() + 1, 1, fixture.rows.length, fixture.headers.length).setValues(fixture.rows);
          inserted = fixture.rows.length;
        }
        summary.push({ sheetName: fixture.sheetName, purpose: fixture.purpose, inserted: inserted });
      });
      return { ok: true, action: 'seed-semantic-ai-fixtures', entities: summary };
    } catch (error) {
      Logger.log("Erro em seedSyntheticAiData: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em seedSyntheticAiData: " + error.message);
    throw error;
  }
}

function prepareAiIntegrationFixtures(options) {
  options = options || {};
  return {
    structure: restoreAiCrudStructure(options),
    synthetic: seedSyntheticAiData(options),
    visualization: seedSyntheticVisualizationData(options)
  };
}
/* CODEX_VISUALIZATION_FIXTURES_V1: dados pequenos para validar os notebook.py. */
function _codexVisualizationSpreadsheet_(options) {
  try {
    try {
      options = options || {};
      if (options.spreadsheet) return options.spreadsheet;
      if (typeof getBoundSpreadsheet_ === 'function') return getBoundSpreadsheet_();
      if (typeof getSS === 'function') return getSS();
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) return active;
      var props = PropertiesService.getScriptProperties();
      var spreadsheetId = props.getProperty('SPREADSHEETS_ID') || props.getProperty('SPREADSHEET_ID');
      if (!spreadsheetId) throw new Error('SPREADSHEETS_ID nao configurado para seed de visualizacoes.');
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      Logger.log("Erro em _codexVisualizationSpreadsheet_: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _codexVisualizationSpreadsheet_: " + error.message);
    throw error;
  }
}

function _codexVisualizationRows_(projectName) {
  try {
    var today = new Date();
    var categories = ['Leitura', 'Matematica', 'Ciencias', 'Artes'];
    var statuses = ['Planejado', 'Em andamento', 'Concluido'];
    var rows = [];
    for (var i = 0; i < 16; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (15 - i));
      var categoria = categories[i % categories.length];
      var status = statuses[i % statuses.length];
      var ciclo = Math.floor(i / categories.length);
      var metricaA = 48 + (i * 3) + (ciclo * 2);
      var metricaB = 32 + ((i % 5) * 7) + ciclo;
      var valor = 120 + (i * 11) + ((i % 3) * 17);
      rows.push([
        'VIS_SYN_' + Utilities.formatString('%02d', i + 1),
        Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        categoria,
        status,
        metricaA,
        metricaB,
        valor,
        'Amostra sintetica para validar graficos do notebook.py',
        projectName
      ]);
    }
    return rows;
  } catch (error) {
    Logger.log("Erro em _codexVisualizationRows_: " + error.message);
    throw error;
  }
}

function seedSyntheticVisualizationData(options) {
  try {
    try {
      try {
        options = options || {};
        var ss = _codexVisualizationSpreadsheet_(options);
        var sheetName = options.sheetName || 'Visualizacoes_Sinteticas';
        var projectName = options.projectName || (typeof PROJECT_NAME !== 'undefined' ? PROJECT_NAME : ss.getName());
        var headers = ['ID', 'Data', 'Categoria', 'Status', 'Metrica_A', 'Metrica_B', 'Valor', 'Observacao', 'Projeto'];
        var rows = _codexVisualizationRows_(projectName);
        var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

        if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }

        if (options.reset === true && sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), headers.length)).clearContent();
        }

        var existing = {};
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().forEach(function(row) {
            existing[String(row[0] || '')] = true;
          });
        }

        var toInsert = rows.filter(function(row) { return options.append === true || !existing[row[0]]; });
        if (toInsert.length) {
          sheet.getRange(sheet.getLastRow() + 1, 1, toInsert.length, headers.length).setValues(toInsert);
        }

        return {
          ok: true,
          action: 'seed-synthetic-visualization-data',
          sheetName: sheetName,
          inserted: toInsert.length,
          totalRows: sheet.getLastRow() - 1
        };
      } catch (error) {
        Logger.log("Erro em seedSyntheticVisualizationData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em seedSyntheticVisualizationData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em seedSyntheticVisualizationData: " + error.message);
    throw error;
  }
}




