/**
 * @file AuditService.gs
 * @description Trilha de auditoria para mudancas pedagogicamente sensiveis.
 */

var AuditService = (function() {

  function normalizeValue_(value) {
    try {
      if (value === null || typeof value === 'undefined') return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    } catch (error) {
      Logger.log("Erro em normalizeValue_: " + error.message);
      throw error;
    }
  }

  function recordStatusChange(change) {
    try {
      change = change || {};
      var timestamp = change.timestamp || new Date().toISOString();
      var userId = change.userId || '';
      var action = change.action || 'STATUS_CHANGE';
      var entity = change.entity || '';
      var recordId = change.recordId || '';
      var oldValue = normalizeValue_(change.oldValue);
      var newValue = normalizeValue_(change.newValue);
      var details = JSON.stringify(change.details || {});

      var id = Database.appendRow(Config.SHEET_NAMES.AUDIT_LOGS, [
        timestamp,
        userId,
        action,
        entity,
        recordId,
        oldValue,
        newValue,
        details
      ]);

      return StandardReturn.ok({
        auditId: id,
        timestamp: timestamp,
        userId: userId,
        action: action,
        oldValue: oldValue,
        newValue: newValue
      });
    } catch (err) {
      return ResponseHandler.error(err, 'AuditService.recordStatusChange');
    }
  }

  return {
    recordStatusChange: recordStatusChange
  };
})();
