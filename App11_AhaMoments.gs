/**
 * @file       App11_AhaMoments.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Monitoramento de Momentos Eureka.
 *   Sensores utilizados: EEG, EDA e ECG.
 *
 * @description
 *   Detecta a assinatura neurofisiológica do insight: burst de Gama (~40 Hz) no lobo temporal anterior direito precedido por aumento de Alfa (EEG), pico de EDA (arousal dopaminérgico) e variação brusca do intervalo RR (ECG). Janela de detecção: 500 ms.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_AHA
 *   Config.gs                  : Config.SHEET_NAMES.APP_AHA
 *   BiometricDataController.gs : Fornece dados brutos de EEG, EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_AhaMoments.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_AHA)
 *   session_id | student_id | timestamp (ISO 8601) | gamma_burst_temporal | alpha_preceding | eda_peak | rr_variation | aha_confidence_score | created_at
 */

var App_AhaMoments_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_AHA, payload, {
      logger: '[App_AhaMoments_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_AHA, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_AHA, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
