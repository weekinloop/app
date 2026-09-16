/**
 * @file       App24_PostErrorResilience.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Avaliação de Resiliência Pós-erro.
 *   Sensores utilizados: EDA e ECG.
 *
 * @description
 *   Monitora ERN/Pe (EEG) como marcadores de detecção e consciência do erro. Quantifica velocidade de extinção do pico de EDA (regulação amigdaliana pelo CPFvm) e tempo de retorno da HRV ao basal (eficiência do freio vagal). Distingue mentalidade de crescimento de evitação.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_RESILIENCE
 *   Config.gs                  : Config.SHEET_NAMES.APP_RESILIENCE
 *   BiometricDataController.gs : Fornece dados brutos de EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Resilience.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_RESILIENCE)
 *   session_id | student_id | timestamp (ISO 8601) | eda_peak_amplitude | eda_extinction_time_s | hrv_recovery_time_s | pe_amplitude | growth_mindset_index | resilience_score | created_at
 */

var App_PostErrorResilience_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_RESILIENCE, payload, {
      logger: '[App_PostErrorResilience_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_RESILIENCE, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_RESILIENCE, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
