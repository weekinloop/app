/**
 * @file       App03_ADHDRegulation.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Treinamento de Autorregulação para TDAH.
 *   Sensores utilizados: EEG, ECG e EDA.
 *
 * @description
 *   Implementa neurofeedback para supressão da DMN e aumento de Beta frontal (EEG). Monitora tônus vagal via HRV (ECG) e hiperexcitabilidade simpática residual (EDA). Registra progresso na convergência dos três sinais em parâmetros de autorregulação.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_ADHD
 *   Config.gs                  : Config.SHEET_NAMES.APP_ADHD
 *   BiometricDataController.gs : Fornece dados brutos de EEG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_ADHD.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_ADHD)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: beta_power | dmn_suppression_index | hrv_ms | eda_tonic | regulation_score
 */

var App_ADHDRegulation_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'beta_power', 'dmn_suppression_index', 'hrv_ms', 'eda_tonic', 'regulation_score'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_ADHD, biometricPayload, {
      logger: '[App_ADHDRegulation_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_ADHD, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_ADHD, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('adhd', 'Autorregulação TDAH', App_ADHDRegulation_);
