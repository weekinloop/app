/**
 * @file       App22_LeadershipStyles.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Identificação de Estilos de Liderança em Grupos.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Aplica a Teoria Polivagal (Porges): líderes eficazes mantêm alta HRV (freio vagal ativo) em situações de grupo estressantes. Detecta acoplamento cardíaco interpessoal (ECG) e excitação coletiva sincronizada (EDA) para identificar líderes naturais.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_LEADERSHIP
 *   Config.gs                  : Config.SHEET_NAMES.APP_LEADERSHIP
 *   BiometricDataController.gs : Fornece dados brutos de ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_STEM.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_LEADERSHIP)
 *   session_id | student_id | timestamp (ISO 8601) | hrv_ms | rr_interval_ms | eda_conductance | cardiac_coupling_index | eda_sync_group | leadership_score | created_at
 */

var App_LeadershipStyles_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_LEADERSHIP, payload, {
      logger: '[App_LeadershipStyles_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_LEADERSHIP, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_LEADERSHIP, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
