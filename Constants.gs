/**
 * @file Constants.gs
 * @description Centraliza estados, severidades e mensagens compartilhadas.
 */

const Constants = {
  ALERT_STATUS: {
    PENDING: 'pendente',
    RESOLVED: 'resolvido'
  },

  ALERT_SEVERITY: {
    INFO: 'info',
    WARNING: 'aviso',
    CRITICAL: 'critico'
  },

  SESSION_STATUS: {
    ACTIVE: 'ativa',
    CLOSED: 'encerrada'
  },

  ERROR_MESSAGES: {
    PERMISSION_DENIED: 'Permissão negada.',
    SESSION_INVALID: 'Sessão inválida ou expirada.',
    SESSION_NOT_ACTIVE: 'Sessão biométrica inexistente ou não ativa.',
    INTERNAL_ERROR: 'Não foi possível concluir a operação.',
    APPLICATION_NOT_FOUND: 'Aplicação não encontrada.',
    ALERT_NOT_FOUND: 'Alerta não encontrado.',
    TOKEN_NOT_FOUND: 'Token não encontrado.',
    INVALID_EMAIL: 'E-mail inválido.',
    unknownAlertType: function(tipo) {
      return 'Tipo de alerta desconhecido: ' + tipo;
    },
    invalidAlertThresholds: function(keys) {
      try {
        return 'Limiares de alerta inválidos ou ausentes: ' + keys.join(', ');
      } catch (error) {
        Logger.log("Erro em invalidAlertThresholds: " + error.message);
        throw error;
      }
    },
    missingStudentThresholdProfile: function(profile) {
      return 'Perfil neurofisiológico de limiares ausente para estudante: ' + profile;
    },
    invalidReportType: function(tipo) {
      return 'Tipo de relatório inválido: ' + tipo;
    },
    notFound: function(entityName) {
      return entityName + ' não encontrado.';
    },
    unknownAction: function(action) {
      return 'Ação desconhecida: ' + action;
    },
    requiredFields: function(fields) {
      try {
        return fields.join(', ') + ' é obrigatório.';
      } catch (error) {
        Logger.log("Erro em requiredFields: " + error.message);
        throw error;
      }
    }
  }
};
