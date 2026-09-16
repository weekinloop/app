/**
 * @file ValidationService.gs
 * @description Valida parametros de entrada comuns usados por controllers e apps.
 */

var ValidationService = (function() {
  function requireFields(payload, fields) {
    try {
      payload = payload || {};
      var missing = [];
      (fields || []).forEach(function(field) {
        if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
          missing.push(field);
        }
      });
      if (missing.length > 0) {
        return StandardReturn.fail(Constants.ERROR_MESSAGES.requiredFields(missing));
      }
      return StandardReturn.ok({ fields: fields || [] });
    } catch (error) {
      Logger.log("Erro em requireFields: " + error.message);
      throw error;
    }
  }

  function requireSessionAndStudent(payload) {
    return requireFields(payload, ['sessionId', 'studentId']);
  }

  function requireStudent(payload) {
    return requireFields(payload, ['studentId']);
  }

  function requireSession(payload) {
    return requireFields(payload, ['sessionId']);
  }

  return {
    requireFields: requireFields,
    requireSessionAndStudent: requireSessionAndStudent,
    requireStudent: requireStudent,
    requireSession: requireSession
  };
})();
