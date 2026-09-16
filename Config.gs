/**
 * @file       Config.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Módulo de configuração global. Centraliza constantes, variáveis de
 *   ambiente e nomes de abas da planilha Google Sheets (banco de dados).
 *
 * @description
 *   O SPREADSHEETS_ID é lido das Propriedades de Script (variáveis de
 *   ambiente nativas do Google Apps Script), garantindo que nenhuma
 *   credencial fique exposta no código-fonte. Todos os demais módulos
 *   consomem constantes via o namespace Config.
 *
 * @integrations
 *   Code.gs (APP_TITLE, APP_VERSION), Database.gs (SPREADSHEETS_ID,
 *   SHEET_NAMES), Auth.gs (SESSION_DURATION_MS, SHEET_NAMES.USERS),
 *   Triggers.gs (BACKUP_FOLDER_ID), todos os Controllers (SHEET_NAMES)
 *
 * @envVariables (Arquivo > Propriedades do projeto no editor do GAS)
 *   SPREADSHEETS_ID   : ID da planilha Google Sheets principal
 *   BACKUP_FOLDER_ID  : ID da pasta Google Drive para backups automáticos
 *   ADMIN_EMAIL       : E-mail do administrador para notificações críticas
 *
 * @sheetNames
 *   Cada chave em SHEET_NAMES corresponde a uma aba da planilha principal.
 *   Os nomes devem ser mantidos sincronizados com as abas reais.
 */

var Config = (function() {
  var _cachedProperties = null;

  function loadProperties_() {
    try {
      if (_cachedProperties === null) {
        _cachedProperties = PropertiesService.getScriptProperties().getProperties();
      }
      return _cachedProperties;
    } catch (error) {
      Logger.log("Erro em loadProperties_: " + error.message);
      throw error;
    }
  }

  function getProperty_(key, fallback) {
    var properties = loadProperties_();
    return properties[key] || fallback || '';
  }

  function refresh() {
    _cachedProperties = null;
    var properties = loadProperties_();
    Config.SPREADSHEETS_ID = properties.SPREADSHEETS_ID || '';
    Config.BACKUP_FOLDER_ID = properties.BACKUP_FOLDER_ID || '';
    Config.ADMIN_EMAIL = properties.ADMIN_EMAIL || '';
    return {
      spreadsheetConfigured: !!Config.SPREADSHEETS_ID,
      backupConfigured: !!Config.BACKUP_FOLDER_ID,
      adminEmailConfigured: !!Config.ADMIN_EMAIL
    };
  }

  return {
    APP_TITLE   : 'Neuro-educação Personalizada',
    APP_VERSION : '1.0.0',

    SPREADSHEETS_ID  : getProperty_('SPREADSHEETS_ID'),

    getSpreadsheetId: function() {
      return this.SPREADSHEETS_ID;
    },
    getProperty: getProperty_,
    refresh: refresh,
    BACKUP_FOLDER_ID : getProperty_('BACKUP_FOLDER_ID'),
    ADMIN_EMAIL      : getProperty_('ADMIN_EMAIL'),

    SHEET_NAMES : {
      USERS           : 'Usuarios',
      SESSIONS_AUTH   : 'SessoesAuth',
      STUDENTS        : 'Estudantes',
      TEACHERS        : 'Professores',
      CLASSES         : 'Turmas',
      SENSORS         : 'Sensores',
      BIO_SESSIONS    : 'SessoesBiometricas',
      EEG_DATA        : 'DadosEEG',
      ECG_DATA        : 'DadosECG',
      EDA_DATA        : 'DadosEDA',
      POG_DATA        : 'DadosPOG',
      ALERTS          : 'Alertas',
      AUDIT_LOGS      : 'Audit_Logs',
      INTERVENTIONS   : 'Intervencoes',
      REPORTS         : 'Relatorios',
      GAMIFICATION    : 'Gamificacao',
      APP_READING     : 'App_FluenciaLeitura',
      APP_MATH        : 'App_AnsiedadeMatematica',
      APP_ADHD        : 'App_AutorregulacaoTDAH',
      APP_SCIENCE     : 'App_LaboratorioCiencias',
      APP_AAC         : 'App_ComunicacaoAumentativa',
      APP_GAMIF       : 'App_EngajamentoGamificacao',
      APP_PHYSICAL    : 'App_EducacaoFisica',
      APP_DYSLEXIA    : 'App_FocoVisualDislexia',
      APP_MEMORY      : 'App_MemoriaDeTrabalho',
      APP_MINDFULNESS : 'App_Mindfulness',
      APP_AHA         : 'App_MomentosEureka',
      APP_ERGONOMICS  : 'App_Ergonomia',
      APP_READING_EXP : 'App_LeituraExpressiva',
      APP_STUDY       : 'App_PadroesEstudo',
      APP_METHODOLOGY : 'App_Metodologias',
      APP_REACTION    : 'App_JogosReacao',
      APP_DISTRACTION : 'App_MicroDistracoes',
      APP_CREATIVE    : 'App_EscritaCriativa',
      APP_ARTISTIC    : 'App_RetornoArtistico',
      APP_PREFERENCES : 'App_PreferenciasAprendizado',
      APP_STEM        : 'App_EsforcoSTEM',
      APP_LEADERSHIP  : 'App_EstilosLideranca',
      APP_MUSIC       : 'App_Musicoterapia',
      APP_RESILIENCE  : 'App_ResilienciaPosErro'
    },

    SESSION_DURATION_MS : 8 * 60 * 60 * 1000,

    GAMIFICATION : {
      FLOW_EDA_MIN    : 2,
      FLOW_EDA_MAX    : 8,
      FLOW_HRV_MIN    : 35,
      DIFFICULTY_STEP : 0.1
    }
  };
})();

// Legacy alias kept for gradual migration of older calls.
var Config_ = Config;
