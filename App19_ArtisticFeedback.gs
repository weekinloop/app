/**
 * @file       App19_ArtisticFeedback.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Retorno Fisiológico em Atividades Artísticas.
 *   Sensores utilizados: EDA e ECG.
 *
 * @description
 *   Posiciona o aluno no modelo do circumplex de emoções (Russell, 1980) em tempo real: alta EDA + alta HRV = entusiasmo; alta EDA + baixa HRV = ansiedade; baixa EDA + alta HRV = serenidade. Desenvolve consciência interoceptiva via retorno visual.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_ARTISTIC
 *   Config.gs                  : Config.SHEET_NAMES.APP_ARTISTIC
 *   BiometricDataController.gs : Fornece dados brutos de EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Arts.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ARTISTIC)
 *   session_id | student_id | timestamp (ISO 8601) | eda_conductance | hrv_ms | valence_axis | arousal_axis | emotion_quadrant | interoceptive_score | created_at
 */

var App_ArtisticFeedback_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_ARTISTIC, payload, {
      logger: '[App_ArtisticFeedback_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_ARTISTIC, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_ARTISTIC, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
