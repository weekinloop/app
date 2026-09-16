/**
 * @file       App08_DyslexiaFocus.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Treinamento de Foco Visual em Dislexia.
 *   Sensores utilizados: POG, ECG e EDA.
 *
 * @description
 *   Quantifica instabilidade binocular (déficit magnocelular) via frequência de perda de fixação e sacadas corretivas (POG). Monitora carga alostática acumulada (HRV decrescente no ECG) e micro-episódios de frustração (picos de EDA) para calibrar velocidade dos alvos.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_DYSLEXIA
 *   Config.gs                  : Config.SHEET_NAMES.APP_DYSLEXIA
 *   BiometricDataController.gs : Fornece dados brutos de POG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Dyslexia.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_DYSLEXIA)
 *   session_id | student_id | timestamp (ISO 8601) | fixation_loss_count | corrective_saccades | hrv_ms | eda_peaks | target_speed | stability_score | created_at
 */

var App_DyslexiaFocus_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_DYSLEXIA, payload, {
      logger: '[App_DyslexiaFocus_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_DYSLEXIA, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_DYSLEXIA, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
