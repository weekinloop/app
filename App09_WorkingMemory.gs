/**
 * @file       App09_WorkingMemory.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Avaliação de Memória de Trabalho.
 *   Sensores utilizados: EEG e POG.
 *
 * @description
 *   Monitora oscilações Teta frontais (4-8 Hz) como marcador de carga na memória de trabalho (Jensen & Tesche, 2002). Detecta saturação via platô/colapso de Teta + comportamento de ping-pong no POG (releitura errática de dados do enunciado).
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_MEMORY
 *   Config.gs                  : Config.SHEET_NAMES.APP_MEMORY
 *   BiometricDataController.gs : Fornece dados brutos de EEG e POG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Memory.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG e POG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MEMORY)
 *   session_id | student_id | timestamp (ISO 8601) | theta_power_frontal | alpha_power | pog_ping_pong_index | working_memory_load | capacity_estimate | created_at
 */

var App_WorkingMemory_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG e POG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_MEMORY, payload, {
      logger: '[App_WorkingMemory_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_MEMORY, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_MEMORY, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
