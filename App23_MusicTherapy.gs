/**
 * @file       App23_MusicTherapy.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Musicoterapia e Foco em Matemática.
 *   Sensores utilizados: EEG, ECG e EDA.
 *
 * @description
 *   Avalia arrastamento neural autonômico (EEG Alfa parietal ~120 BPM), componente parassimpático musical (HRV via ECG) e diferenciação simpática de estilos musicais (EDA). Prescreve ambiente sonoro com precisão neurobiológica para atenção sustentada.
 *
 * @integrations
 *   Code.gs                    : Rota específica desta aplicação
 *   Database.gs                : appendRow(), getAll() para Config.SHEET_NAMES.APP_MUSIC
 *   Config.gs                  : Config.SHEET_NAMES.APP_MUSIC
 *   BiometricDataController.gs : Fornece dados brutos de EEG, ECG e EDA
 *   AlertController.gs         : Gera alertas específicos desta aplicação
 *   SessionController.gs       : Vincula dados ao sessionId ativo
 *   GamificationController.gs  : Ajuste de dificuldade (quando aplicável)
 *   App_Resilience.html                 : Interface de visualização desta aplicação
 *   notebook.py                : Envia métricas processadas de EEG, ECG e EDA
 *
 * @sheetColumns (aba Config.SHEET_NAMES.APP_MUSIC)
 *   session_id | student_id | timestamp (ISO 8601) | alpha_parietal | hrv_ms | eda_tonic | music_bpm | music_type | cognitive_performance_score | created_at
 */

var App_MusicTherapy_ = (function() {

  /**
   * Salva um registro de dados desta aplicação.
   * @param  {Object} payload  Dados biométricos processados de EEG, ECG e EDA
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function saveRecord(payload, session) {
    return DataService.saveRecord(Config.SHEET_NAMES.APP_MUSIC, payload, {
      logger: '[App_MusicTherapy_.saveRecord]'
    });
  }

  /**
   * Consulta registros desta aplicação por sessão e/ou estudante.
   * @param  {Object} payload  {sessionId, studentId?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getRecords(payload, session) {
    return DataService.getRecords(Config.SHEET_NAMES.APP_MUSIC, payload);
  }

  /**
   * Calcula indicadores agregados para relatório desta aplicação.
   * @param  {Object} payload  {studentId, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {indicators}, error}
   */
  function getIndicators(payload, session) {
    return DataService.getIndicators(Config.SHEET_NAMES.APP_MUSIC, payload);
  }

  return { saveRecord: saveRecord, getRecords: getRecords, getIndicators: getIndicators };

})();
