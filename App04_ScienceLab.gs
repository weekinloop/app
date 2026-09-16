/**
 * @file       App04_ScienceLab.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Laboratório de Ciências — Sistema Circulatório.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Explora aprendizagem incorporada: o aluno observa seu próprio ECG acelerar após exercício e a EDA variar com emoções, conectando neurociência afetiva ao conteúdo curricular. Registra o efeito de geração (Slamecka & Graf) via comparação de retenção pré/pós.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_SCIENCE
 *   Config.gs                  : Config.SHEET_NAMES.APP_SCIENCE
 *   BiometricDataController.gs : Fornece dados brutos de ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Science.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_SCIENCE)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: heart_rate_bpm | hrv_ms | eda_conductance | activity_phase | retention_score
 */

var App_ScienceLab_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'heart_rate_bpm', 'hrv_ms', 'eda_conductance', 'activity_phase', 'retention_score'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_SCIENCE, biometricPayload, {
      logger: '[App_ScienceLab_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_SCIENCE, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_SCIENCE, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('science', 'Laboratório de Ciências', App_ScienceLab_);
