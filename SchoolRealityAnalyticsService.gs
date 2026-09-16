/**
 * codex-school-reality-analytics
 * Registra, analisa e expõe ao menos duas leituras sobre manifestacao comportamental e fisiologica da aprendizagem.
 */
var SCHOOL_REALITY_ANALYTICS_CONTEXT = {
  projectName: "WeekInLoop - Biometria nos anos iniciais",
  focus: "manifestacao comportamental e fisiologica da aprendizagem",
  sheetName: "Analytics_Reality"
};

try {
  if (typeof SCHOOL_REALITY_STUDY_CONTEXT !== "undefined") {
    SCHOOL_REALITY_ANALYTICS_CONTEXT.focus = SCHOOL_REALITY_STUDY_CONTEXT.focus || SCHOOL_REALITY_ANALYTICS_CONTEXT.focus;
    SCHOOL_REALITY_ANALYTICS_CONTEXT.study = SCHOOL_REALITY_STUDY_CONTEXT;
  }
} catch (ignored) {}

var SchoolRealityAnalyticsService = (function() {
  var HEADERS = [
    "ID", "Timestamp", "ProjectName", "Focus", "AnalysisKey", "AnalysisLabel",
    "Value", "Unit", "Dimension", "Narrative", "Source", "CreatedAt"
  ];

  function getSpreadsheet_() {
    if (typeof getProjectSpreadsheet === "function") return getProjectSpreadsheet();
    return getBoundSpreadsheet_();
  }

  function getSheet_(name) {
    try {
      var spreadsheet = getSpreadsheet_();
      var sheet = spreadsheet.getSheetByName(name);
      if (!sheet) sheet = spreadsheet.insertSheet(name);
      var lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
      var current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      var needsHeader = current.slice(0, HEADERS.length).join("") === "" ||
        HEADERS.some(function(header, index) { return current[index] !== header; });
      if (needsHeader) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      return sheet;
    } catch (error) {
      Logger.log("Erro em getSheet_: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }

  function normalizeKey_(value) {
    return String(value || "")
      .replace(/([a-z0-9])([A-Z])/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
  }

  function getSchemas_() {
    try {
      if (typeof SchemaService !== "undefined" && SchemaService.getSchemas) {
        return SchemaService.getSchemas();
      }
    } catch (ignored) {}
    try {
      if (typeof getSchemas === "function") return getSchemas({ includeOptional: true });
    } catch (ignored) {}
    return {};
  }

  function readRows_(sheetName) {
    try {
      var sheet = getSpreadsheet_().getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() < 2) return [];
      var values = sheet.getDataRange().getValues();
      var headers = values.shift().map(function(header) { return String(header || ""); });
      return values.map(function(row) {
        var item = {};
        headers.forEach(function(header, index) { if (header) item[header] = row[index]; });
        return item;
      });
    } catch (ignored) {
      return [];
    }
  }

  function collectRealityRows_() {
    var schemas = getSchemas_();
    var rows = [];
    Object.keys(schemas).forEach(function(key) {
      var schema = schemas[key] || {};
      var sheetName = schema.sheetName;
      if (!sheetName || sheetName === SCHOOL_REALITY_ANALYTICS_CONTEXT.sheetName) return;
      readRows_(sheetName).forEach(function(row) {
        rows.push({ entity: normalizeKey_(key), sheetName: sheetName, row: row });
      });
    });
    return rows;
  }

  function findFirst_(row, names) {
    try {
      var keys = Object.keys(row || {});
      for (var i = 0; i < names.length; i++) {
        var target = normalizeKey_(names[i]);
        for (var j = 0; j < keys.length; j++) {
          if (normalizeKey_(keys[j]) === target) return row[keys[j]];
        }
      }
      return "";
    } catch (error) {
      Logger.log("Erro em findFirst_: " + error.message);
      throw error;
    }
  }

  function isAttentionStatus_(value) {
    try {
      var status = String(value || "").toLowerCase();
      if (!status) return false;
      return /risco|atenc|pend|atras|falha|erro|baixo|crit|inativo|ausente|reprov|descarte|vencid/.test(status);
    } catch (error) {
      Logger.log("Erro em isAttentionStatus_: " + error.message);
      throw error;
    }
  }

  function toNumber_(value) {
    try {
      if (typeof value === "number" && isFinite(value)) return value;
      var normalized = String(value || "").replace(",", ".");
      var number = Number(normalized);
      return isFinite(number) ? number : null;
    } catch (error) {
      Logger.log("Erro em toNumber_: " + error.message);
      throw error;
    }
  }

  function round_(value) {
    return Math.round(value * 100) / 100;
  }

  function buildAnalyses_(rows) {
    try {
      var study = SCHOOL_REALITY_ANALYTICS_CONTEXT.study || {};
      var total = rows.length;
      var sheets = {};
      var attention = 0;
      var numericValues = [];

      rows.forEach(function(entry) {
        sheets[entry.sheetName] = true;
        var row = entry.row || {};
        var status = findFirst_(row, ["Status", "Situacao", "Estado", "Resultado", "Risco", "Nivel", "Classificacao"]);
        if (isAttentionStatus_(status)) attention++;

        Object.keys(row).some(function(key) {
          if (!/score|nota|media|rmssd|alpha|theta|progresso|performance|percent|taxa|nivel|valor/i.test(key)) return false;
          var number = toNumber_(row[key]);
          if (number === null) return false;
          numericValues.push(number);
          return true;
        });
      });

      var sheetCount = Object.keys(sheets).length;
      var numericAverage = numericValues.length
        ? round_(numericValues.reduce(function(sum, value) { return sum + value; }, 0) / numericValues.length)
        : 0;
      var attentionRate = total ? round_((attention / total) * 100) : 0;

      return [
        {
          key: "coverage",
          label: study.analysisOneLabel || "Cobertura de registros acompanhados",
          value: total,
          unit: "registros",
          dimension: study.analysisOneDimension || "registro",
          narrative: "Foram localizados " + total + " registros em " + sheetCount + " abas de dados para leitura da " + SCHOOL_REALITY_ANALYTICS_CONTEXT.focus + "." +
            (study.summary ? " O estudo associado orienta a leitura para: " + study.summary : ""),
          source: study.primarySource || "SchemaService + planilhas operacionais"
        },
        {
          key: "attention_or_performance",
          label: attention > 0
            ? (study.analysisTwoAttentionLabel || "Sinais que pedem atencao")
            : (study.analysisTwoPerformanceLabel || "Media de desempenho observavel"),
          value: attention > 0 ? attentionRate : numericAverage,
          unit: attention > 0 ? "% dos registros" : "media",
          dimension: attention > 0 ? (study.analysisTwoAttentionDimension || "manifestacao/gestao") : (study.analysisTwoPerformanceDimension || "desempenho"),
          narrative: attention > 0
            ? attention + " registros indicam pendencia, risco ou necessidade de acompanhamento no contexto: " + SCHOOL_REALITY_ANALYTICS_CONTEXT.focus + "."
            : "A media sintetiza campos numericos alinhados ao estudo do projeto, como desempenho, progresso, comportamento, fisiologia ou gestao quando presentes.",
          source: study.secondarySource || "status e campos numericos das planilhas"
        }
      ];
    } catch (error) {
      Logger.log("Erro em buildAnalyses_: " + error.message);
      throw error;
    }
  }

  function recordAnalysis_(analysis) {
    try {
      try {
        var now = new Date();
        var id = "SRA-" + now.getTime() + "-" + analysis.key;
        getSheet_(SCHOOL_REALITY_ANALYTICS_CONTEXT.sheetName).appendRow([
          id,
          now,
          SCHOOL_REALITY_ANALYTICS_CONTEXT.projectName,
          SCHOOL_REALITY_ANALYTICS_CONTEXT.focus,
          analysis.key,
          analysis.label,
          analysis.value,
          analysis.unit,
          analysis.dimension,
          analysis.narrative,
          analysis.source,
          now
        ]);
      } catch (error) {
        Logger.log("Erro em recordAnalysis_: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em recordAnalysis_: " + error.message);
      throw error;
    }
  }

  function computeAnalyses(options) {
    try {
      options = options || {};
      var analyses = buildAnalyses_(collectRealityRows_());
      if (options.record !== false) {
        analyses.forEach(recordAnalysis_);
      }
      return analyses;
    } catch (error) {
      Logger.log("Erro em computeAnalyses: " + error.message);
      throw error;
    }
  }

  function getAnalyticsSummary(options) {
    options = options || {};
    var analyses = computeAnalyses({ record: options.record !== false });
    return {
      projectName: SCHOOL_REALITY_ANALYTICS_CONTEXT.projectName,
      focus: SCHOOL_REALITY_ANALYTICS_CONTEXT.focus,
      generatedAt: new Date(),
      analyses: analyses
    };
  }

  function recordObservation(payload) {
    try {
      payload = payload || {};
      var analysis = {
        key: String(payload.key || "manual_observation"),
        label: String(payload.label || "Observacao registrada"),
        value: payload.value === undefined ? "" : payload.value,
        unit: String(payload.unit || "observacao"),
        dimension: String(payload.dimension || "realidade escolar"),
        narrative: String(payload.narrative || payload.note || ""),
        source: String(payload.source || "registro manual")
      };
      recordAnalysis_(analysis);
      return StandardReturn.ok({ analysis: analysis });
    } catch (error) {
      Logger.log("Erro em recordObservation: " + error.message);
      throw error;
    }
  }

  return {
    ensureAnalyticsSheet: function() { return getSheet_(SCHOOL_REALITY_ANALYTICS_CONTEXT.sheetName).getName(); },
    computeAnalyses: computeAnalyses,
    getAnalyticsSummary: getAnalyticsSummary,
    recordObservation: recordObservation
  };
})();

function getSchoolRealityAnalyticsSummary(options) {
  return SchoolRealityAnalyticsService.getAnalyticsSummary(options || {});
}

function recordSchoolRealityAnalyticsObservation(payload) {
  return SchoolRealityAnalyticsService.recordObservation(payload || {});
}