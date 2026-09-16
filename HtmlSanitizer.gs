/**
 * @file HtmlSanitizer.gs
 * @description Escapa texto antes de persistir ou exibir em paineis HTML.
 */
var HtmlSanitizer = (function() {
  var ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  function escapeText(value) {
    try {
      if (value === null || typeof value === 'undefined') return '';
      return String(value).replace(/[&<>"'\/]/g, function(character) {
        return ENTITY_MAP[character];
      }).trim();
    } catch (error) {
      Logger.log("Erro em escapeText: " + error.message);
      throw error;
    }
  }

  function sanitizeAlertRecord(alert) {
    try {
      if (!alert) return alert;
      var sanitized = {};
      Object.keys(alert).forEach(function(key) {
        sanitized[key] = alert[key];
      });
      sanitized.mensagem = escapeText(alert.mensagem);
      sanitized.sugestao_intervencao = escapeText(alert.sugestao_intervencao);
      if (Object.prototype.hasOwnProperty.call(alert, 'observacao_resolucao')) {
        sanitized.observacao_resolucao = escapeText(alert.observacao_resolucao);
      }
      return sanitized;
    } catch (error) {
      Logger.log("Erro em sanitizeAlertRecord: " + error.message);
      throw error;
    }
  }

  return {
    escapeText: escapeText,
    sanitizeAlertRecord: sanitizeAlertRecord
  };
})();
