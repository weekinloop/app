/**
 * @file       App14_StudyPatterns.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Identificação de Padrões de Estudo Ineficazes.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Detecta vagância mental: POG com sacadas progressivas mas fixações rasas (<200 ms) combinado com baixa coerência EEG nas redes linguísticas. Aciona perguntas de verificação imediata para reconvocar a atenção executiva e forçar processamento profundo.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_STUDY
 *   Config.gs                  : Config.SHEET_NAMES.APP_STUDY
 *   BiometricDataController.gs : Fornece dados brutos de POG e EEG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_StudyPatterns.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG e EEG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_STUDY)
 *   session_id | student_id | timestamp (ISO 8601) | fixation_duration_ms | linguistic_coherence_eeg | dmn_activity | mind_wandering_flag | intervention_triggered | created_at
 */

var App_StudyPatterns_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG e EEG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_STUDY, payload, {
      logger: '[App_StudyPatterns_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_STUDY, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_STUDY, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
