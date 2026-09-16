/**
 * @file       App12_Ergonomics.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Ergonomia e Conforto em Sala de Aula.
 *   Sensores utilizados: EDA, POG e ECG.
 *
 * @description
 *   Quantifica reflexos de orientação não pedagógicos via picos de EDA e sacadas reflexivas do POG. Monitora deterioração progressiva da HRV (carga alostática) ao longo da aula. Fornece evidências fisiológicas para reformas ergonômicas do ambiente.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_ERGONOMICS
 *   Config.gs                  : Config.SHEET_NAMES.APP_ERGONOMICS
 *   BiometricDataController.gs : Fornece dados brutos de EDA, POG e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Ergonomics.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EDA, POG e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ERGONOMICS)
 *   session_id | student_id | timestamp (ISO 8601) | eda_orientation_peaks | pog_reflexive_saccades | hrv_ms | allostatic_load_index | environment_score | created_at
 */

var App_Ergonomics_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EDA, POG e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_ERGONOMICS, payload, {
      logger: '[App_Ergonomics_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_ERGONOMICS, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_ERGONOMICS, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
