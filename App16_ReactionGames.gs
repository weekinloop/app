/**
 * @file       App16_ReactionGames.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Jogos de Reação e Controle de Impulsividade.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Monitora o componente N200 (detecção de conflito pelo CCA, ~200 ms) e P300 (resolução inibitória pelo CPFDL) no EEG. Calcula SSRT (Stop Signal Reaction Time) comportamental. POG verifica se o déficit é perceptual ou regulatório.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_REACTION
 *   Config.gs                  : Config.SHEET_NAMES.APP_REACTION
 *   BiometricDataController.gs : Fornece dados brutos de POG e EEG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Gamification.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG e EEG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_REACTION)
 *   session_id | student_id | timestamp (ISO 8601) | n200_amplitude | n200_latency | p300_amplitude | ssrt_ms | pog_target_accuracy | inhibitory_control_score | created_at
 */

var App_ReactionGames_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG e EEG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_REACTION, payload, {
      logger: '[App_ReactionGames_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_REACTION, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_REACTION, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
