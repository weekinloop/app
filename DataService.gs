/**
 * @file DataService.gs
 * @description Servico generico para persistencia e consulta dos modulos App_*.
 * Todas as operacoes retornam { success:boolean, data:any|null, error:string|null }.
 *
 * @typedef {Object} BiometricPayload
 * @property {Object} metadata {sessionId, studentId, timestamp}
 * @property {Object} metrics Dados biometricos especificos do modulo.
 */

var DataService = (function() {
  function normalizeTimestamp_(value) {
    try {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'number' && isFinite(value)) {
        var numericDate = new Date(value);
        if (!isNaN(numericDate.getTime())) return numericDate.toISOString();
      }
      if (typeof value === 'string' && value.trim()) {
        var stringDate = new Date(value);
        if (!isNaN(stringDate.getTime())) return stringDate.toISOString();
      }
      return new Date().toISOString();
    } catch (error) {
      Logger.log("Erro em normalizeTimestamp_: " + error.message);
      throw error;
    }
  }

  function buildBiometricPayload(payload, metricKeys) {
    try {
      payload = payload || {};
      if (payload.metadata && payload.metrics) {
        return {
          metadata: {
            sessionId: payload.metadata.sessionId,
            studentId: payload.metadata.studentId,
            timestamp: normalizeTimestamp_(payload.metadata.timestamp)
          },
          metrics: payload.metrics || {}
        };
      }

      var metrics = {};
      (metricKeys || []).forEach(function(key) {
        if (payload[key] !== undefined) metrics[key] = payload[key];
      });

      return {
        metadata: {
          sessionId: payload.sessionId,
          studentId: payload.studentId,
          timestamp: normalizeTimestamp_(payload.timestamp)
        },
        metrics: metrics
      };
    } catch (error) {
      Logger.log("Erro em buildBiometricPayload: " + error.message);
      throw error;
    }
  }

  function flattenBiometricPayload_(payload) {
    try {
      var biometricPayload = buildBiometricPayload(payload);
      var metadata = biometricPayload.metadata || {};
      var metrics = biometricPayload.metrics || {};
      var flat = {
        session_id: metadata.sessionId,
        student_id: metadata.studentId,
        timestamp: normalizeTimestamp_(metadata.timestamp)
      };
      Object.keys(metrics).forEach(function(key) {
        flat[key] = metrics[key];
      });
      return flat;
    } catch (error) {
      Logger.log("Erro em flattenBiometricPayload_: " + error.message);
      throw error;
    }
  }

  function getWritableHeaders_(sheetName) {
    try {
      var schema = SchemaService.getSchema(sheetName);
      return (schema.headers || []).filter(function(header) {
        return ['id', 'created_at', 'updated_at'].indexOf(String(header).toLowerCase()) === -1;
      });
    } catch (error) {
      Logger.log("Erro em getWritableHeaders_: " + error.message);
      throw error;
    }
  }

  function buildRowData_(sheetName, payload) {
    try {
      var flat = flattenBiometricPayload_(payload);
      return getWritableHeaders_(sheetName).map(function(header) {
        return flat[header] === undefined ? '' : flat[header];
      });
    } catch (error) {
      Logger.log("Erro em buildRowData_: " + error.message);
      throw error;
    }
  }

  function buildRecordFilters_(payload) {
    payload = payload || {};
    if (payload.metadata) payload = payload.metadata;
    var filters = {};
    if (payload.sessionId) filters.session_id = payload.sessionId;
    if (payload.studentId) filters.student_id = payload.studentId;
    if (payload.periodoInicio || payload.periodoFim) {
      filters.timestamp = {};
      if (payload.periodoInicio) filters.timestamp.$gte = normalizeTimestamp_(payload.periodoInicio);
      if (payload.periodoFim) filters.timestamp.$lte = normalizeTimestamp_(payload.periodoFim);
    }
    return filters;
  }

  function saveRecord(sheetName, payload, options) {
    try {
      return StandardReturn.tryRun(function() {
        var biometricPayload = buildBiometricPayload(payload);
        var validation = ValidationService.requireSessionAndStudent(biometricPayload.metadata);
        if (!validation.success) return validation;
        var activeSession = SessionController.requireActiveSession(biometricPayload.metadata);
        if (!activeSession.success) return activeSession;
        var rowData = options && options.rowData ? options.rowData : buildRowData_(sheetName, biometricPayload);
        var id = Database.appendRow(sheetName, rowData);
        return { recordId: id };
      });
    } catch (error) {
      Logger.log("Erro em saveRecord: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }

  function getRecords(sheetName, payload) {
    return StandardReturn.tryRun(function() {
      var records = Database.getAll(sheetName, buildRecordFilters_(payload));
      return records.map(function(record) {
        if (record.timestamp !== undefined && record.timestamp !== null && record.timestamp !== '') {
          record.timestamp = normalizeTimestamp_(record.timestamp);
        }
        return record;
      });
    });
  }

  function getIndicators(sheetName, payload, options) {
    try {
      return StandardReturn.tryRun(function() {
        payload = payload || {};
        var filters = buildRecordFilters_(payload);
        var records = Database.getAll(sheetName, filters);
        if (options && typeof options.indicatorBuilder === 'function') {
          return options.indicatorBuilder(records, payload);
        }
        return {
          totalRecords: records.length,
          records: records
        };
      });
    } catch (error) {
      Logger.log("Erro em getIndicators: " + error.message);
      throw error;
    }
  }

  function updateRecord(sheetName, recordId, updates) {
    return StandardReturn.tryRun(function() {
      var validation = ValidationService.requireFields({ recordId: recordId }, ['recordId']);
      if (!validation.success) return validation;
      var ok = Database.updateById(sheetName, recordId, updates || {});
      if (!ok) return StandardReturn.fail(Constants.ERROR_MESSAGES.notFound('Registro'));
      return { recordId: recordId };
    });
  }

  return {
    saveRecord: saveRecord,
    getRecords: getRecords,
    normalizeTimestamp: normalizeTimestamp_,
    buildBiometricPayload: buildBiometricPayload,
    getIndicators: getIndicators,
    updateRecord: updateRecord
  };
})();
