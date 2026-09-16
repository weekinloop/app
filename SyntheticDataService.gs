/**
 * @file SyntheticDataService.gs
 * @description Popula as abas do projeto com poucos dados sinteticos coerentes
 * para demonstrar analises, processamentos, relatorios, tabelas e graficos.
 */

var SYNTHETIC_DATA_SERVICE_PROJECT = "WeekInLoop - Biometria nos anos iniciais";
var SYNTHETIC_DATA_PREFIX = 'SYN-DEMO-';

var SyntheticDataService = (function() {
  function getNow_() {
    return new Date();
  }

  function isoDate_(offsetDays) {
    try {
      var date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } catch (error) {
      Logger.log("Erro em isoDate_: " + error.message);
      throw error;
    }
  }

  function timestamp_(offsetDays) {
    try {
      var date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      Logger.log("Erro em timestamp_: " + error.message);
      throw error;
    }
  }

  function getSchemas_() {
    if (typeof SchemaService === 'undefined' || typeof SchemaService.getSchemas !== 'function') {
      throw new Error('SchemaService.gs precisa estar disponivel antes de popular dados sinteticos.');
    }
    return SchemaService.getSchemas({ asArray: true });
  }

  function getSheet_(schema, options) {
    try {
      if (typeof SchemaService.ensureSheet === 'function') {
        SchemaService.ensureSheet(schema.entity, options || {});
      }
      if (typeof SchemaService.getSheet === 'function') {
        return SchemaService.getSheet(schema.entity, options || {});
      }
      var spreadsheet = options && options.spreadsheet ? options.spreadsheet : getBoundSpreadsheet_();
      return spreadsheet.getSheetByName(schema.sheetName);
    } catch (error) {
      Logger.log("Erro em getSheet_: " + error.message);
      throw error;
    }
  }

  function readHeaders_(sheet) {
    try {
      if (!sheet || sheet.getLastColumn() === 0) return [];
      return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
        return String(header || '').trim();
      });
    } catch (error) {
      Logger.log("Erro em readHeaders_: " + error.message);
      throw error;
    }
  }

  function syntheticId_(schema, index) {
    return SYNTHETIC_DATA_PREFIX + schema.entity + '-' + String(index + 1);
  }

  function isSyntheticRow_(row, headers) {
    for (var i = 0; i < headers.length; i++) {
      var value = String(row[i] || '');
      if (value.indexOf(SYNTHETIC_DATA_PREFIX) === 0) return true;
    }
    return false;
  }

  function clearSyntheticData(options) {
    try {
      try {
        options = options || {};
        var schemas = getSchemas_();
        var summary = [];

        schemas.forEach(function(schema) {
          var sheet = getSheet_(schema, options);
          if (!sheet || sheet.getLastRow() < 2) {
            summary.push({ entity: schema.entity, removed: 0 });
            return;
          }
          var headers = readHeaders_(sheet);
          var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
          var rowsToKeep = values.filter(function(row) { return !isSyntheticRow_(row, headers); });
          var removed = values.length - rowsToKeep.length;
          if (removed > 0) {
            sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
            if (rowsToKeep.length > 0) {
              sheet.getRange(2, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
            }
          }
          summary.push({ entity: schema.entity, removed: removed });
        });

        return StandardReturn.ok({ project: SYNTHETIC_DATA_SERVICE_PROJECT, action: 'clear', sheets: summary });
      } catch (error) {
        Logger.log("Erro em clearSyntheticData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em clearSyntheticData: " + error.message);
      throw error;
    }
  }

  function seedSyntheticData(options) {
    try {
      try {
        options = options || {};
        if (options.reset !== false) {
          clearSyntheticData(options);
        }

        var schemas = getSchemas_();
        var summary = [];
        schemas.forEach(function(schema) {
          var sheet = getSheet_(schema, options);
          var headers = readHeaders_(sheet);
          var rows = buildRowsForSchema_(schema, headers, options);
          if (rows.length > 0) {
            sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
          }
          summary.push({ entity: schema.entity, sheetName: schema.sheetName, inserted: rows.length });
        });

        var report = buildSyntheticScenarioReport_(schemas, summary);
        return StandardReturn.ok({
          project: SYNTHETIC_DATA_SERVICE_PROJECT,
          action: 'seed',
          prefix: SYNTHETIC_DATA_PREFIX,
          sheets: summary,
          report: report
        });
      } catch (error) {
        Logger.log("Erro em seedSyntheticData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em seedSyntheticData: " + error.message);
      throw error;
    }
  }

  function buildRowsForSchema_(schema, headers, options) {
    try {
      var size = Math.max(4, Math.min(Number(options.sampleSize || 6), 10)); // ampliado: >=4 linhas por caso de uso
      var rows = [];
      for (var i = 0; i < size; i++) {
        var record = buildRecord_(schema, i);
        rows.push(headers.map(function(header) {
          return valueForHeader_(header, schema, i, record);
        }));
      }
      return rows;
    } catch (error) {
      Logger.log("Erro em buildRowsForSchema_: " + error.message);
      throw error;
    }
  }

  function buildRecord_(schema, index) {
    var statusCycle = ['Ativo', 'Em analise', 'Concluido', 'Pendente'];
    var trend = index + 1;
    return {
      id: syntheticId_(schema, index),
      name: syntheticName_(schema, index),
      status: statusCycle[index % statusCycle.length],
      score: 62 + trend * 7,
      amount: 1200 + trend * 315,
      count: 8 + trend * 3,
      percentage: 54 + trend * 9,
      date: isoDate_(-sizeOffset_(index)),
      timestamp: timestamp_(-sizeOffset_(index)),
      notes: 'Registro sintetico para demonstrar ' + schema.entity + ' em analises, tabelas, graficos e relatorios.',
      project: SYNTHETIC_DATA_SERVICE_PROJECT
    };
  }

  function sizeOffset_(index) {
    return 10 - index * 2;
  }

  function syntheticName_(schema, index) {
    var labels = ['Cenario base', 'Cenario comparativo', 'Cenario critico', 'Cenario consolidado', 'Cenario tendencia'];
    return labels[index % labels.length] + ' - ' + schema.entity;
  }

  function valueForHeader_(header, schema, index, record) {
    try {
      var normalized = String(header || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (!normalized) return '';
      if (normalized === 'id' || normalized.indexOf('recordid') >= 0 || normalized.indexOf('codigo') >= 0) return record.id;
      if (normalized.indexOf('name') >= 0 || normalized.indexOf('nome') >= 0 || normalized.indexOf('title') >= 0 || normalized.indexOf('titulo') >= 0) return record.name;
      if (normalized.indexOf('email') >= 0) return 'demo.' + (index + 1) + '@synthetic.local';
      if (normalized.indexOf('username') >= 0 || normalized.indexOf('usuario') >= 0) return 'demo_' + schema.entity.toLowerCase() + '_' + (index + 1);
      if (normalized.indexOf('password') >= 0 || normalized.indexOf('senha') >= 0) return 'synthetic-hash-' + (index + 1);
      if (normalized.indexOf('role') >= 0 || normalized.indexOf('perfil') >= 0) return index === 0 ? 'admin' : 'viewer';
      if (normalized.indexOf('status') >= 0 || normalized.indexOf('situacao') >= 0) return record.status;
      if (normalized.indexOf('date') >= 0 || normalized.indexOf('data') >= 0) return record.date;
      if (normalized.indexOf('timestamp') >= 0 || normalized.indexOf('created') >= 0 || normalized.indexOf('criado') >= 0) return record.timestamp;
      if (normalized.indexOf('updated') >= 0 || normalized.indexOf('atualizado') >= 0) return timestamp_(0);
      if (normalized.indexOf('generated') >= 0 || normalized.indexOf('gerado') >= 0) return timestamp_(0);
      if (normalized.indexOf('score') >= 0 || normalized.indexOf('nota') >= 0 || normalized.indexOf('indice') >= 0) return record.score;
      if (normalized.indexOf('amount') >= 0 || normalized.indexOf('valor') >= 0 || normalized.indexOf('total') >= 0 || normalized.indexOf('saldo') >= 0) return record.amount;
      if (normalized.indexOf('count') >= 0 || normalized.indexOf('qtd') >= 0 || normalized.indexOf('quantidade') >= 0) return record.count;
      if (normalized.indexOf('percent') >= 0 || normalized.indexOf('taxa') >= 0) return record.percentage;
      if (normalized.indexOf('phone') >= 0 || normalized.indexOf('telefone') >= 0) return '(61) 90000-000' + index;
      if (normalized.indexOf('description') >= 0 || normalized.indexOf('descricao') >= 0 || normalized.indexOf('notes') >= 0 || normalized.indexOf('observ') >= 0 || normalized.indexOf('message') >= 0) return record.notes;
      if (normalized.indexOf('type') >= 0 || normalized.indexOf('tipo') >= 0 || normalized.indexOf('category') >= 0 || normalized.indexOf('categoria') >= 0) return syntheticCategory_(schema, index);
      if (normalized.indexOf('period') >= 0 || normalized.indexOf('periodo') >= 0) return '2026-S' + (index + 1);
      if (normalized.indexOf('url') >= 0 || normalized.indexOf('link') >= 0) return 'https://example.com/synthetic/' + schema.entity.toLowerCase() + '/' + (index + 1);
      if (normalized === 'key' || normalized.indexOf('chave') >= 0) return 'synthetic.' + schema.entity.toLowerCase() + '.' + (index + 1);
      if (normalized === 'value' || normalized.indexOf('valor') >= 0) return String(record.score);
      if (normalized.indexOf('user') >= 0 || normalized.indexOf('aluno') >= 0 || normalized.indexOf('student') >= 0) return SYNTHETIC_DATA_PREFIX + 'USER-' + (index + 1);
      if (normalized.indexOf('entity') >= 0 || normalized.indexOf('entidade') >= 0) return schema.entity;
      if (normalized.indexOf('action') >= 0 || normalized.indexOf('acao') >= 0) return index % 2 === 0 ? 'CREATE' : 'ANALYZE';
      if (normalized.indexOf('level') >= 0 || normalized.indexOf('nivel') >= 0) return index === 2 ? 'WARN' : 'INFO';
      return record.project + ' | ' + schema.entity + ' | amostra ' + (index + 1);
    } catch (error) {
      Logger.log("Erro em valueForHeader_: " + error.message);
      throw error;
    }
  }

  function syntheticCategory_(schema, index) {
    var lower = schema.entity.toLowerCase();
    if (lower.indexOf('report') >= 0 || lower.indexOf('relatorio') >= 0) return 'Relatorio sintetico';
    if (lower.indexOf('log') >= 0 || lower.indexOf('audit') >= 0) return 'Evento de auditoria';
    if (lower.indexOf('user') >= 0 || lower.indexOf('usuario') >= 0) return 'Perfil demo';
    return ['Baseline', 'Processamento', 'Analise', 'Visualizacao'][index % 4];
  }

  function buildSyntheticScenarioReport_(schemas, summary) {
    try {
      var totalRows = summary.reduce(function(total, item) { return total + item.inserted; }, 0);
      return {
        generatedAt: timestamp_(0),
        project: SYNTHETIC_DATA_SERVICE_PROJECT,
        totalSheets: schemas.length,
        totalRows: totalRows,
        chartHints: [
          'serie temporal por Date/Timestamp',
          'barras por Status/Type/Category',
          'tabela de registros por entidade',
          'cards de Score/Amount/Count quando houver colunas numericas'
        ],
        narrative: 'Cenario sintetico pequeno para exercitar CRUD, pipelines de analise, relatorios e visualizacoes.'
      };
    } catch (error) {
      Logger.log("Erro em buildSyntheticScenarioReport_: " + error.message);
      throw error;
    }
  }

  function runSmokeTest(options) {
    var seed = seedSyntheticData(options || { reset: true, sampleSize: 3 });
    var validation = typeof SchemaService !== 'undefined' && typeof SchemaService.validateSpreadsheet === 'function'
      ? SchemaService.validateSpreadsheet(options || {})
      : [];
    return StandardReturn.ok({ seed: seed, validation: validation });
  }

  return {
    seedSyntheticData: seedSyntheticData,
    clearSyntheticData: clearSyntheticData,
    runSmokeTest: runSmokeTest
  };
})();

function seedProjectSyntheticData(options) {
  return SyntheticDataService.seedSyntheticData(options || {});
}

function clearProjectSyntheticData(options) {
  return SyntheticDataService.clearSyntheticData(options || {});
}

function runProjectSyntheticDataSmokeTest(options) {
  return SyntheticDataService.runSmokeTest(options || {});
}

function popularDadosSinteticosProjeto(options) {
  return seedProjectSyntheticData(options || {});
}
