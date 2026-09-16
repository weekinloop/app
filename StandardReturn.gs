/**
 * codex-standard-return-contract
 * Envelope comum para funcoes que acessam dados ou podem falhar.
 *
 * Formato canonico:
 *   { success: boolean, data: any|null, error: string|null, meta: Object }
 *
 * Estrategia:
 *   StandardReturn.normalize() e a ponte entre contratos historicos usados nos
 *   webapps: { success, data, message, code }, { ok, ... }, ResponseBuilder
 *   ({ statusCode, status, payload }) e valores crus. Consumidores novos devem
 *   normalizar retornos externos antes de inspecionar sucesso, erro ou payload.
 */
var StandardReturn = (function() {
  function now_() {
    try {
      return new Date().toISOString();
    } catch (error) {
      Logger.log("Erro em now_: " + error.message);
      throw error;
    }
  }

  function hasOwn_(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function errorMessage_(error) {
    try {
      if (error === null || error === undefined) return null;
      if (typeof error === "string") return error;
      if (error.message) return String(error.message);
      if (error.error) return errorMessage_(error.error);
      return String(error);
    } catch (error) {
      Logger.log("Erro em errorMessage_: " + error.message);
      throw error;
    }
  }

  function metaFrom_(source, extra) {
    try {
      var meta = {};
      source = source || {};
      extra = extra || {};

      ["code", "status", "statusCode", "message", "timestamp", "generatedAt"].forEach(function(key) {
        if (hasOwn_(source, key) && source[key] !== undefined && source[key] !== null) {
          meta[key] = source[key];
        }
      });

      Object.keys(extra).forEach(function(key) {
        if (extra[key] !== undefined && extra[key] !== null) meta[key] = extra[key];
      });

      if (!meta.generatedAt) meta.generatedAt = now_();
      return meta;
    } catch (error) {
      Logger.log("Erro em metaFrom_: " + error.message);
      throw error;
    }
  }

  function ok(data, meta) {
    return {
      success: true,
      data: data === undefined ? null : data,
      error: null,
      meta: metaFrom_(meta)
    };
  }

  function fail(error, data, meta) {
    return {
      success: false,
      data: data === undefined ? null : data,
      error: errorMessage_(error) || "Erro desconhecido.",
      meta: metaFrom_(meta)
    };
  }

  function isEnvelope(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      typeof value.success === "boolean" &&
      (hasOwn_(value, "data") || hasOwn_(value, "error") || hasOwn_(value, "message"))
    );
  }

  function payloadWithout_(value, ignoredKeys) {
    try {
      var data = {};
      Object.keys(value || {}).forEach(function(key) {
        if (ignoredKeys.indexOf(key) === -1) data[key] = value[key];
      });
      return data;
    } catch (error) {
      Logger.log("Erro em payloadWithout_: " + error.message);
      throw error;
    }
  }

  function normalizeSuccess_(value) {
    if (hasOwn_(value, "data")) return ok(value.data, metaFrom_(value, value.meta));
    if (hasOwn_(value, "payload")) return ok(value.payload, metaFrom_(value, value.meta));
    return ok(payloadWithout_(value, ["success", "ok", "error", "message", "meta"]), metaFrom_(value, value.meta));
  }

  function normalizeFailure_(value) {
    var data = hasOwn_(value, "data")
      ? value.data
      : (hasOwn_(value, "payload") ? value.payload : null);
    return fail(value.error || value.message || value.reason, data, metaFrom_(value, value.meta));
  }

  function normalizeStatus_(value) {
    try {
      var statusCode = Number(value.statusCode || value.code);
      var isSuccess = statusCode >= 200 && statusCode < 400;
      if (isSuccess) return normalizeSuccess_(value);
      return normalizeFailure_(value);
    } catch (error) {
      Logger.log("Erro em normalizeStatus_: " + error.message);
      throw error;
    }
  }

  function normalize(value) {
    if (isEnvelope(value)) {
      return value.success ? normalizeSuccess_(value) : normalizeFailure_(value);
    }

    if (value && typeof value === "object" && typeof value.ok === "boolean") {
      return value.ok ? normalizeSuccess_(value) : normalizeFailure_(value);
    }

    if (value && typeof value === "object" && (hasOwn_(value, "statusCode") || hasOwn_(value, "code"))) {
      return normalizeStatus_(value);
    }

    return ok(value === undefined ? null : value);
  }

  function tryRun(fn) {
    try {
      return normalize(fn());
    } catch (error) {
      return fail(error);
    }
  }

  return {
    ok: ok,
    fail: fail,
    normalize: normalize,
    tryRun: tryRun,
    isEnvelope: isEnvelope
  };
})();

function standardReturnOk(data) {
  return StandardReturn.ok(data);
}

function standardReturnFail(error, data) {
  return StandardReturn.fail(error, data);
}

function standardReturnNormalize(value) {
  return StandardReturn.normalize(value);
}
