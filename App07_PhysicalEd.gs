/**
 * @file       App07_PhysicalEd.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Educação Física Personalizada.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Monitora zonas de frequência cardíaca para maximizar liberação de BDNF (60-80% FC máx). Quantifica velocidade de recuperação vagal (HRV30) e detecta excesso de treinamento via EDA persistentemente elevada após normalização da FC.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_PHYSICAL
 *   Config.gs                  : Config.SHEET_NAMES.APP_PHYSICAL
 *   BiometricDataController.gs : Fornece dados brutos de ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_PhysicalEd.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_PHYSICAL)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: heart_rate_bpm | hrv_ms | eda_conductance | fc_zone | hrv30 | bdnf_proxy
 */

var App_PhysicalEd_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'heart_rate_bpm', 'hrv_ms', 'eda_conductance', 'fc_zone', 'hrv30', 'bdnf_proxy'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_PHYSICAL, biometricPayload, {
      logger: '[App_PhysicalEd_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_PHYSICAL, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_PHYSICAL, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('physicalEd', 'Educação Física', App_PhysicalEd_);
