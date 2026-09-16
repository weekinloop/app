/**
 * @file       App15_MethodologyImpact.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Avaliação de Impacto de Metodologias de Ensino.
 *   Sensores utilizados: EEG, EDA e ECG.
 *
 * @description
 *   Mede sincronia neural interpessoal (hipervarredura EEG), acoplamento cardíaco interpessoal (ECG) e picos de arousal emocional sincronizados (EDA) para comparar metodologias narrativas vs expositivas. Fornece evidências fisiológicas para decisões curriculares.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_METHODOLOGY
 *   Config.gs                  : Config.SHEET_NAMES.APP_METHODOLOGY
 *   BiometricDataController.gs : Fornece dados brutos de EEG, EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Methodologies.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_METHODOLOGY)
 *   session_id | student_id | timestamp (ISO 8601) | neural_sync_index | cardiac_coupling | eda_sync_peaks | methodology_type | engagement_score | created_at
 */

var App_MethodologyImpact_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_METHODOLOGY, payload, {
      logger: '[App_MethodologyImpact_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_METHODOLOGY, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_METHODOLOGY, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
