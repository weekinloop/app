/**
 * @file       Utils.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Biblioteca de funções utilitárias reutilizáveis em todo o projeto.
 *
 * @description
 *   Reúne funções auxiliares sem dependência de domínio: geração de UUIDs,
 *   formatação de datas, validação de tipos, sanitização de strings e
 *   cálculos estatísticos básicos utilizados no processamento biométrico.
 *
 * @integrations
 *   Auth.gs                : generateUUID() para tokens de sessão
 *   Database.gs            : generateUUID() para IDs de registros
 *   BiometricDataController.gs : calcMean(), calcStdDev() para normalização
 *   ReportController.gs    : formatDate(), formatDuration()
 *   AlertController.gs     : isAboveThreshold(), isBelowThreshold()
 *   Todos os Controllers   : sanitizeString(), isValidEmail()
 */

var Utils = (function() {

  /**
   * Gera um UUID v4 usando a primitiva nativa do Apps Script.
   * @return {string}  Ex: "550e8400-e29b-41d4-a716-446655440000"
   */
  function generateUUID() {
    return Utilities.getUuid();
  }

  /**
   * Formata uma data ISO para o padrão brasileiro (DD/MM/AAAA HH:MM).
   * @param  {string|Date} isoDate
   * @return {string}
   */
  function formatDate(isoDate) {
    var d = new Date(isoDate);
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()
      + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /**
   * Formata duração em milissegundos para string legível (HH:MM:SS).
   * @param  {number} ms
   * @return {string}
   */
  function formatDuration(ms) {
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  /**
   * Remove caracteres especiais de uma string (sanitização básica).
   * @param  {string} str
   * @return {string}
   */
  function sanitizeString(str) {
    try {
      if (typeof str !== 'string') return '';
      return str.replace(/[<>"'&]/g, '').trim();
    } catch (error) {
      Logger.log("Erro em sanitizeString: " + error.message);
      throw error;
    }
  }

  /**
   * Valida formato de e-mail.
   * @param  {string} email
   * @return {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Calcula a média de um array numérico.
   * @param  {number[]} arr
   * @return {number}
   */
  function calcMean(arr) {
    try {
      if (!arr || arr.length === 0) return 0;
      return arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
    } catch (error) {
      Logger.log("Erro em calcMean: " + error.message);
      throw error;
    }
  }

  /**
   * Calcula o desvio padrão de um array numérico.
   * @param  {number[]} arr
   * @return {number}
   */
  function calcStdDev(arr) {
    try {
      if (!arr || arr.length < 2) return 0;
      var mean = calcMean(arr);
      var variance = arr.reduce(function(sum, val) {
        return sum + Math.pow(val - mean, 2);
      }, 0) / arr.length;
      return Math.sqrt(variance);
    } catch (error) {
      Logger.log("Erro em calcStdDev: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica se um valor está acima de um limiar.
   * @param  {number} value
   * @param  {number} threshold
   * @return {boolean}
   */
  function isAboveThreshold(value, threshold) {
    return typeof value === 'number' && value > threshold;
  }

  /**
   * Verifica se um valor está abaixo de um limiar.
   * @param  {number} value
   * @param  {number} threshold
   * @return {boolean}
   */
  function isBelowThreshold(value, threshold) {
    return typeof value === 'number' && value < threshold;
  }

  /**
   * Clamp: limita um valor entre min e max.
   * @param  {number} value
   * @param  {number} min
   * @param  {number} max
   * @return {number}
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  return {
    generateUUID       : generateUUID,
    formatDate         : formatDate,
    formatDuration     : formatDuration,
    sanitizeString     : sanitizeString,
    isValidEmail       : isValidEmail,
    calcMean           : calcMean,
    calcStdDev         : calcStdDev,
    isAboveThreshold   : isAboveThreshold,
    isBelowThreshold   : isBelowThreshold,
    clamp              : clamp
  };

})();

// Legacy alias kept for gradual migration of older calls.
var Utils_ = Utils;
