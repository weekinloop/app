/**
 * @file       App10_Mindfulness.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Mindfulness e Foco em Sala de Aula.
 *   Sensores utilizados: EEG, ECG e EDA.
 *
 * @description
 *   Monitora aumento de potência Alfa occipital/parietal e surgimento de ritmos Alfa-Teta (EEG), elevação de HRV via ativação vagal (ECG) e redução gradual de condutância da pele (EDA) durante práticas de atenção plena. Cria retorno fisiológico visual em tempo real.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_MINDFULNESS
 *   Config.gs                  : Config.SHEET_NAMES.APP_MINDFULNESS
 *   BiometricDataController.gs : Fornece dados brutos de EEG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Mindfulness.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MINDFULNESS)
 *   session_id | student_id | timestamp (ISO 8601) | alpha_occipital | alpha_theta_junction | hrv_ms | eda_conductance | mindfulness_score | created_at
 */

var App_Mindfulness_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_MINDFULNESS, payload, {
      logger: '[App_Mindfulness_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_MINDFULNESS, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_MINDFULNESS, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
