/**
 * @file       App18_CreativeWriting.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Escrita Criativa e Fluxo de Ideias.
 *   Sensores utilizados: EEG, ECG e EDA.
 *
 * @description
 *   Diferencia bloqueio ansioso (hiperfrontalidade Beta + HRV baixa + EDA tônica elevada) de bloqueio por tédio (Alfa frontal elevado + EDA baixa + ECG estável). Intervenções opostas: relaxamento para ansiedade, novidade para tédio.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_CREATIVE
 *   Config.gs                  : Config.SHEET_NAMES.APP_CREATIVE
 *   BiometricDataController.gs : Fornece dados brutos de EEG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Arts.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_CREATIVE)
 *   session_id | student_id | timestamp (ISO 8601) | beta_high_freq_frontal | alpha_frontal | hrv_ms | eda_tonic | block_type | creative_flow_score | created_at
 */

var App_CreativeWriting_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_CREATIVE, payload, {
      logger: '[App_CreativeWriting_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_CREATIVE, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_CREATIVE, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
