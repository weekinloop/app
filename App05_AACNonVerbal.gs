/**
 * @file       App05_AACNonVerbal.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Comunicação Aumentativa para Alunos Não-Verbais.
 *   Sensores utilizados: POG e EEG.
 *
 * @description
 *   Distingue fixação intencional (com Bereitschaftspotential no EEG) de reflexo de orientação acidental (sacada reflexiva sem potencial pré-motor). Usa coerência cortico-cortical frontoparietal (EEG) para validar intenção comunicativa via POG.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_AAC
 *   Config.gs                  : Config.SHEET_NAMES.APP_AAC
 *   BiometricDataController.gs : Fornece dados brutos de POG e EEG
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_AAC.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de POG e EEG
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_AAC)
 *   metadata: sessionId | studentId | timestamp (ISO 8601)
 *   metrics: fixation_target | bereitschaftspotential | frontal_parietal_coherence | intent_confirmed | symbol_selected
 */

var App_AACNonVerbal_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de POG e EEG
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    var biometricPayload = DataService.buildBiometricPayload(payload, [
      'fixation_target', 'bereitschaftspotential', 'frontal_parietal_coherence', 'intent_confirmed', 'symbol_selected'
    ]);
    return DataService.saveRecord(Config.SHEET_NAMES.APP_AAC, biometricPayload, {
      logger: '[App_AACNonVerbal_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_AAC, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_AAC, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();

if (typeof AppController !== 'undefined') AppController.register('aac', 'Comunicação Aumentativa', App_AACNonVerbal_);
