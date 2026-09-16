/**
 * @file       App17_DistractionMicroMoments.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Detecção de Micro-momentos de Distração.
 *   Sensores utilizados: POG, EDA e ECG.
 *
 * @description
 *   Diferencia distração por estímulo externo (pico de EDA antes do desvio do POG = reflexo de orientação amigdaliano) de distração interna por tédio (queda de EDA antes do desvio = subexcitação do LC-NE). Antecipa via queda de HRV (fadiga autonômica).
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_DISTRACTION
 *   Config.gs                  : Config.SHEET_NAMES.APP_DISTRACTION
 *   BiometricDataController.gs : Fornece dados brutos de POG, EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_StudyPatterns.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG, EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_DISTRACTION)
 *   session_id | student_id | timestamp (ISO 8601) | pog_gaze_deviation | eda_pre_deviation | hrv_ms | distraction_type | lc_ne_fatigue_index | created_at
 */

var App_DistractionMicroMoments_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG, EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_DISTRACTION, payload, {
      logger: '[App_DistractionMicroMoments_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_DISTRACTION, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_DISTRACTION, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
