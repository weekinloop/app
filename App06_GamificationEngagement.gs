/**
 * @file       App06_GamificationEngagement.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Avaliação de Engajamento em Gamificação.
 *   Sensores utilizados: EEG, EDA e ECG.
 *
 * @description
 *   Distingue estado de fluxo (alta EDA + HRV preservada + hipofrontalidade EEG) de ansiedade (alta EDA + HRV colapsada). Ajusta dificuldade em tempo real via GamificationController_ para manter o aluno no ápice da curva de Yerkes-Dodson.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_GAMIF
 *   Config.gs                  : Config.SHEET_NAMES.APP_GAMIF
 *   BiometricDataController.gs : Fornece dados brutos de EEG, EDA e ECG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Gamification.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, EDA e ECG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_GAMIF)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: eda_value | hrv_ms | alpha_frontal | flow_state | difficulty_level
 */

var App_GamificationEngagement_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, EDA e ECG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'eda_value', 'hrv_ms', 'alpha_frontal', 'flow_state', 'difficulty_level'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_GAMIF, biometricPayload, {
      logger: '[App_GamificationEngagement_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_GAMIF, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_GAMIF, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('gamification', 'Engajamento em Gamificação', App_GamificationEngagement_);
