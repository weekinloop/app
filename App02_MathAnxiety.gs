/**
 * @file       App02_MathAnxiety.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Monitoramento de Ansiedade em Matemática.
 *   Sensores utilizados: ECG e EDA.
 *
 * @description
 *   Detecta o sequestro amigdaliano que comprime a memória de trabalho matemática. Correlaciona queda de HRV (ECG) com picos de EDA nos minutos que antecedem avaliações. Sugere respiração diafragmática ou reformatação avaliativa quando HRV < limiar e EDA > limiar.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_MATH
 *   Config.gs                  : Config.SHEET_NAMES.APP_MATH
 *   BiometricDataController.gs : Fornece dados brutos de ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Math.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MATH)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: hrv_ms | eda_peaks | heart_rate_bpm | pre_test_flag | anxiety_score
 */

var App_MathAnxiety_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'hrv_ms', 'eda_peaks', 'heart_rate_bpm', 'pre_test_flag', 'anxiety_score'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_MATH, biometricPayload, {
      logger: '[App_MathAnxiety_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_MATH, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_MATH, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('math', 'Ansiedade Matemática', App_MathAnxiety_);
