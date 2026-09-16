/**
 * @file       App20_LearningPreferences.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Avaliação de Preferências de Aprendizado.
 *   Sensores utilizados: EDA, POG e ECG.
 *
 * @description
 *   Identifica o canal de processamento mais eficiente: fixações longas (>400 ms) no POG indicam extração semântica ativa; EDA captura saliência emocional do formato; HRV (ECG) detecta sobrecarga integrativa multimodal (carga intrínseca excessiva de Sweller).
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_PREFERENCES
 *   Config.gs                  : Config.SHEET_NAMES.APP_PREFERENCES
 *   BiometricDataController.gs : Fornece dados brutos de EDA, POG e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Preferences.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EDA, POG e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_PREFERENCES)
 *   session_id | student_id | timestamp (ISO 8601) | fixation_duration_ms | eda_engagement | hrv_ms | format_type | processing_depth_score | preferred_channel | created_at
 */

var App_LearningPreferences_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EDA, POG e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_PREFERENCES, payload, {
      logger: '[App_LearningPreferences_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_PREFERENCES, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_PREFERENCES, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
