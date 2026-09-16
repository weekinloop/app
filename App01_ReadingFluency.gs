/**
 * @file       App01_ReadingFluency.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Diagnóstico de Fluência de Leitura.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Monitora a razão Teta/Alfa (EEG) e regressões oculares (POG) para detectar sobrecarga na via fonológica dorsal. Sinaliza necessidade de intervenção fonética quando POG indica regressões constantes e EEG mostra potência Teta elevada na região frontoparietal esquerda.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_READING
 *   Config.gs                  : Config.SHEET_NAMES.APP_READING
 *   BiometricDataController.gs : Fornece dados brutos de POG e EEG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Reading.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG e EEG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_READING)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: theta_alpha_ratio | regression_count | fixation_duration_ms | intervention_flag
 */

var App_ReadingFluency_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG e EEG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'theta_alpha_ratio', 'regression_count', 'fixation_duration_ms', 'intervention_flag'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_READING, biometricPayload, {
      logger: '[App_ReadingFluency_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_READING, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_READING, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('reading', 'Fluência de Leitura', App_ReadingFluency_);
