/**
 * @file ResponseHandler.gs
 * @description Envelope unico para respostas da API interna do NeuroEdu.
 * Formato JSON: { status, timestamp, data, message }
 */
var ResponseHandler = (function() {
  function messageOf_(value, fallback) {
    try {
      if (value === null || typeof value === 'undefined') return fallback || '';
      if (typeof value === 'string') return value;
      if (value.message) return String(value.message);
      if (value.error) return messageOf_(value.error, fallback);
      return String(value);
    } catch (error) {
      Logger.log("Erro em messageOf_: " + error.message);
      throw error;
    }
  }

  function success(data, message) {
    try {
      return {
        status: 'success',
        success: true,                 // alias para o contrato do frontend (api())
        timestamp: new Date().toISOString(),
        data: typeof data === 'undefined' ? null : data,
        message: message || '',
        error: null                    // alias: nenhum erro
      };
    } catch (error) {
      Logger.log("Erro em success: " + error.message);
      throw error;
    }
  }

  function error(err, context) {
    try {
      var message = messageOf_(err, Constants.ERROR_MESSAGES.INTERNAL_ERROR);
      if (context && typeof LoggerService !== 'undefined') {
        LoggerService.error(context, err);
      }
      return {
        status: 'error',
        success: false,                // alias para o contrato do frontend (api())
        timestamp: new Date().toISOString(),
        data: null,
        message: message,
        error: message                 // alias: frontend lê response.error
      };
    } catch (error) {
      Logger.log("Erro em error: " + error.message);
      throw error;
    }
  }

  function normalize(response, successMessage) {
    try {
      if (response && response.status === 'success') {
        return success(response.data, response.message || successMessage);
      }
      if (response && response.status === 'error') {
        var normMessage = response.message || Constants.ERROR_MESSAGES.INTERNAL_ERROR;
        return {
          status: 'error',
          success: false,
          timestamp: response.timestamp || new Date().toISOString(),
          data: typeof response.data === 'undefined' ? null : response.data,
          message: normMessage,
          error: normMessage
        };
      }
      if (response && typeof response.success === 'boolean') {
        return response.success
          ? success(response.data, successMessage)
          : error(response.error || response.message || Constants.ERROR_MESSAGES.INTERNAL_ERROR);
      }
      return success(typeof response === 'undefined' ? null : response, successMessage);
    } catch (error) {
      Logger.log("Erro em normalize: " + error.message);
      throw error;
    }
  }

  function isSuccess(response) {
    return Boolean(response && (response.status === 'success' || response.success === true));
  }

  function dataOf(response, fallback) {
    if (!isSuccess(response)) return typeof fallback === 'undefined' ? null : fallback;
    if (Object.prototype.hasOwnProperty.call(response, 'data')) return response.data;
    return typeof fallback === 'undefined' ? null : fallback;
  }

  return {
    success: success,
    error: error,
    normalize: normalize,
    isSuccess: isSuccess,
    dataOf: dataOf
  };
})();
