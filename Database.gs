/**
 * @file       Database.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Camada de abstração de acesso ao Google Sheets (banco de dados).
 *   Provê funções genéricas de CRUD utilizadas por todos os controladores.
 *
 * @description
 *   Centraliza a lógica de abertura da planilha, acesso a abas e
 *   operações de leitura/escrita. Ao isolar o acesso ao SpreadsheetApp
 *   neste módulo, os controladores ficam desacoplados da API do Sheets,
 *   facilitando testes e manutenção.
 *
 * @integrations
 *   Config.gs              : Consome SPREADSHEETS_ID para abrir a planilha
 *   Utils.gs               : Usa Utils.generateUUID() em appendRow
 *   Todos os Controllers   : Chamam Database.getSheet(), appendRow(),
 *                            findRowById(), updateRowById(), deleteRowById()
 *
 * @sheetConvention
 *   Todas as abas seguem a convenção:
 *   - Linha 1: cabeçalhos (não modificada pelas funções CRUD)
 *   - Coluna A: ID único (UUID) de cada registro
 *   - Coluna B em diante: campos do domínio
 *
 * @performance
 *   Para evitar o limite de quota do Sheets API, as funções de leitura
 *   usam getDataRange().getValues() (batch read) em vez de leituras
 *   célula a célula. Escritas usam appendRow() ou setValues() em batch.
 */

var Database = (function() {

  var _spreadsheet = null;
  var DEFAULT_BIOMETRIC_ROW_LIMIT = 100;
  var METADATA_CACHE_SECONDS = 300;

  /**
   * Retorna a instância da planilha principal (singleton com cache).
   * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  function _getSpreadsheet() {
    try {
      if (!_spreadsheet) {
        _spreadsheet = SpreadsheetApp.openById(Config.getSpreadsheetId());
      }
      return _spreadsheet;
    } catch (error) {
      Logger.log("Erro em _getSpreadsheet: " + error.message);
      throw error;
    }
  }

  /**
   * Retorna uma aba da planilha pelo nome.
   * Lança erro se a aba não existir.
   *
   * @param  {string} sheetName  Nome da aba (ex: Config.SHEET_NAMES.STUDENTS)
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getSheet(sheetName) {
    var sheet = _getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('Aba não encontrada: ' + sheetName);
    return sheet;
  }

  function cacheKey_(sheetName, filters) {
    try {
      try {
        return 'Database.getAll:' + sheetName + ':' + JSON.stringify(filters || {});
      } catch (error) {
        Logger.log("Erro em cacheKey_: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em cacheKey_: " + error.message);
      throw error;
    }
  }

  function getCache_() {
    return CacheService.getScriptCache();
  }

  function isBiometricSheet_(sheetName) {
    var names = Config.SHEET_NAMES || {};
    var rawSheets = [names.EEG_DATA, names.ECG_DATA, names.EDA_DATA, names.POG_DATA];
    if (rawSheets.indexOf(sheetName) >= 0) return true;
    return /^App_/i.test(String(sheetName || ''));
  }

  function isCacheableMetadataSheet_(sheetName) {
    var names = Config.SHEET_NAMES || {};
    return [
      names.USERS,
      names.STUDENTS,
      names.TEACHERS,
      names.CLASSES,
      names.SENSORS,
      names.SETTINGS
    ].indexOf(sheetName) >= 0;
  }

  function invalidateMetadataCache_(sheetName) {
    if (!isCacheableMetadataSheet_(sheetName)) return;
    try {
      getCache_().remove(cacheKey_(sheetName, null));
    } catch (ignored) {}
  }

  function withWriteLock_(operationName, callback) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw new Error('Nao foi possivel obter lock para ' + operationName + '.');
    }
    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  }

  function readSheetValues_(sheet, sheetName, filters) {
    try {
      var lastRow = sheet.getLastRow();
      var lastColumn = sheet.getLastColumn();
      if (lastRow < 1 || lastColumn < 1) return [];

      if (isBiometricSheet_(sheetName) && !(filters && filters.includeAllRows === true)) {
        var requestedLimit = filters && Number(filters.limit);
        var rowLimit = requestedLimit && isFinite(requestedLimit) && requestedLimit > 0
          ? Math.min(requestedLimit, DEFAULT_BIOMETRIC_ROW_LIMIT)
          : DEFAULT_BIOMETRIC_ROW_LIMIT;
        var dataRows = Math.min(rowLimit, Math.max(lastRow - 1, 0));
        if (dataRows === 0) return sheet.getRange(1, 1, 1, lastColumn).getValues();
        var startRow = Math.max(2, lastRow - dataRows + 1);
        var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
        var rows = sheet.getRange(startRow, 1, dataRows, lastColumn).getValues();
        return [headers].concat(rows);
      }

      return sheet.getDataRange().getValues();
    } catch (error) {
      Logger.log("Erro em readSheetValues_: " + error.message);
      throw error;
    }
  }

  function normalizeFilters_(filters) {
    try {
      if (!filters) return null;
      var normalized = {};
      Object.keys(filters).forEach(function(key) {
        if (key === 'includeAllRows' || key === 'limit') return;
        normalized[key] = filters[key];
      });
      return normalized;
    } catch (error) {
      Logger.log("Erro em normalizeFilters_: " + error.message);
      throw error;
    }
  }

  /**
   * Insere uma nova linha de dados em uma aba.
   * Gera automaticamente um UUID para a coluna A se rowData[0] for vazio.
   *
   * @param  {string}   sheetName
   * @param  {Array}    rowData    Array com os valores da linha (sem o ID)
   * @return {string}              UUID gerado para o novo registro
   */
  function appendRow(sheetName, rowData) {
    try {
      return withWriteLock_('appendRow:' + sheetName, function() {
        var sheet = getSheet(sheetName);
        var id    = Utils.generateUUID();
        var now   = new Date().toISOString();
        sheet.appendRow([id].concat(rowData).concat([now, now])); // id + dados + created_at + updated_at
        invalidateMetadataCache_(sheetName);
        return id;
      });
    } catch (error) {
      Logger.log("Erro em appendRow: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }

  /**
   * Retorna todos os registros de uma aba como array de objetos,
   * usando a primeira linha como chaves.
   *
   * @param  {string}  sheetName
   * @param  {Object}  [filters]  Pares chave/valor para filtrar resultados
   * @return {Array<Object>}
   */
  function getAll(sheetName, filters) {
    try {
      try {
        var sheet   = getSheet(sheetName);
        var useMetadataCache = isCacheableMetadataSheet_(sheetName) && !filters;
        var key = useMetadataCache ? cacheKey_(sheetName, null) : null;
        if (useMetadataCache) {
          var cached = getCache_().get(key);
          if (cached) return JSON.parse(cached);
        }

        var data    = readSheetValues_(sheet, sheetName, filters);
        if (!data.length) return [];
        var headers = data[0];
        var results = [];
        var effectiveFilters = normalizeFilters_(filters);

        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0]) continue; // Ignora linhas vazias
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = row[j];
          }
          if (_matchesFilters(obj, effectiveFilters)) results.push(obj);
        }

        if (useMetadataCache) {
          try {
            getCache_().put(key, JSON.stringify(results), METADATA_CACHE_SECONDS);
          } catch (ignored) {}
        }
        return results;
      } catch (error) {
        Logger.log("Erro em getAll: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getAll: " + error.message);
      throw error;
    }
  }

  /**
   * Busca um registro pelo ID (coluna A).
   *
   * @param  {string} sheetName
   * @param  {string} id
   * @return {Object|null}
   */
  function findById(sheetName, id) {
    try {
      var sheet   = getSheet(sheetName);
      var data    = sheet.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          var obj = {};
          for (var j = 0; j < headers.length; j++) obj[headers[j]] = data[i][j];
          return obj;
        }
      }
      return null;
    } catch (error) {
      Logger.log("Erro em findById: " + error.message);
      throw error;
    }
  }

  /**
   * Atualiza campos de um registro existente pelo ID.
   *
   * @param  {string} sheetName
   * @param  {string} id
   * @param  {Object} updates   Pares chave/valor a atualizar
   * @return {boolean}          true se encontrado e atualizado
   */
  function updateById(sheetName, id, updates) {
    try {
      try {
        return withWriteLock_('updateById:' + sheetName, function() {
          var sheet   = getSheet(sheetName);
          var data    = sheet.getDataRange().getValues();
          var headers = data[0];
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === id) {
              var updatedRow = data[i].slice();
              for (var key in updates) {
                var colIdx = headers.indexOf(key);
                if (colIdx >= 0) updatedRow[colIdx] = updates[key];
              }
              var updatedAtIdx = headers.indexOf('updated_at');
              if (updatedAtIdx >= 0) {
                updatedRow[updatedAtIdx] = new Date().toISOString();
              }
              sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow.slice(0, headers.length)]);
              invalidateMetadataCache_(sheetName);
              return true;
            }
          }
          return false;
        });
      } catch (error) {
        Logger.log("Erro em updateById: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em updateById: " + error.message);
      throw error;
    }
  }

  /**
   * Remove um registro pelo ID (soft delete: marca coluna "ativo" como false).
   *
   * @param  {string} sheetName
   * @param  {string} id
   * @return {boolean}
   */
  function deleteById(sheetName, id) {
    return updateById(sheetName, id, { ativo: false });
  }

  /** Remove definitivamente linhas biométricas anteriores ao corte informado. */
  function deleteBiometricRowsOlderThan(sheetName, cutoff) {
    if (!isBiometricSheet_(sheetName)) throw new Error('RETENTION_SHEET_NOT_ALLOWED');
    var cutoffTime = new Date(cutoff).getTime();
    if (!isFinite(cutoffTime)) throw new Error('RETENTION_CUTOFF_INVALID');
    return withWriteLock_('retention:' + sheetName, function() {
      var sheet = getSheet(sheetName);
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return 0;
      var headers = data[0].map(String);
      var timestampColumn = headers.indexOf('timestamp');
      if (timestampColumn < 0) timestampColumn = headers.indexOf('created_at');
      if (timestampColumn < 0) throw new Error('RETENTION_TIMESTAMP_NOT_FOUND:' + sheetName);
      var removed = 0;
      for (var row = data.length - 1; row >= 1; row--) {
        var recordedAt = new Date(data[row][timestampColumn]).getTime();
        if (isFinite(recordedAt) && recordedAt < cutoffTime) {
          sheet.deleteRow(row + 1);
          removed++;
        }
      }
      return removed;
    });
  }

  /**
   * Verifica se um objeto de registro corresponde a todos os filtros.
   * @private
   */
  function _matchesFilters(obj, filters) {
    if (!filters) return true;
    for (var key in filters) {
      var expected = filters[key];
      var actual = obj[key];
      if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
        if (expected.$gte !== undefined && actual < expected.$gte) return false;
        if (expected.$lte !== undefined && actual > expected.$lte) return false;
        if (expected.$gt !== undefined && actual <= expected.$gt) return false;
        if (expected.$lt !== undefined && actual >= expected.$lt) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
    return true;
  }

  return {
    getSheet   : getSheet,
    appendRow  : appendRow,
    getAll     : getAll,
    findById   : findById,
    updateById : updateById,
    deleteById : deleteById,
    deleteBiometricRowsOlderThan: deleteBiometricRowsOlderThan
  };

})();

// Legacy alias kept for gradual migration of older calls.
var Database_ = Database;
