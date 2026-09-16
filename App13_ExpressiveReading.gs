/**
 * @file       App13_ExpressiveReading.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Treinamento de Leitura Expressiva.
 *   Sensores utilizados: POG, ECG e EDA.
 *
 * @description
 *   Distingue taquicardia moderada com EDA transiente (simpático modulado pelo freio vagal) de colapso bilateral sem recuperação (ansiedade de performance). POG confirma que o texto está sendo processado visualmente. Gradua progressivamente a exposição social.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_READING_EXP
 *   Config.gs                  : Config.SHEET_NAMES.APP_READING_EXP
 *   BiometricDataController.gs : Fornece dados brutos de POG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Reading.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_READING_EXP)
 *   session_id | student_id | timestamp (ISO 8601) | heart_rate_bpm | hrv_ms | eda_conductance | pog_sequential_fixations | performance_anxiety_score | created_at
 */

var App_ExpressiveReading_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_READING_EXP, payload, {
      logger: '[App_ExpressiveReading_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_READING_EXP, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_READING_EXP, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
