/**
 * @file       GamificationController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de gamificação adaptativa.
 *   Ajusta dinamicamente o nível de dificuldade das atividades gamificadas
 *   com base no estado de fluxo detectado pelos biossensores (EEG, EDA, ECG).
 *
 * @description
 *   Implementa o modelo de Csikszentmihalyi: o estado de fluxo ocorre
 *   quando o desafio está calibrado à habilidade do estudante. O sistema
 *   usa a trimodal EEG+EDA+ECG para detectar se o estudante está em
 *   fluxo, em tédio (subexcitação) ou em ansiedade (sobrecarga). Com
 *   base nessa detecção, o nível de dificuldade é incrementado ou
 *   decrementado em Config.GAMIFICATION.DIFFICULTY_STEP. O histórico
 *   de dificuldade é armazenado na aba "Gamificacao" para análise
 *   longitudinal do desenvolvimento de cada estudante.
 *
 * @integrations
 *   Code.gs                    : Rota updateDifficulty
 *   Database.gs                : appendRow(), getAll(), updateById()
 *   Config.gs                  : SHEET_NAMES.GAMIFICATION, GAMIFICATION config
 *   BiometricDataController.gs : Fornece métricas EEG, EDA, ECG para análise
 *   Utils.gs                   : clamp(), isAboveThreshold(), isBelowThreshold()
 *   App_Gamification.html      : Interface do jogo adaptativo
 *   App06_GamificationEngagement.gs : Lógica específica da aplicação
 *
 * @flowDetection
 *   FLOW    : EDA entre FLOW_EDA_MIN e FLOW_EDA_MAX E HRV >= FLOW_HRV_MIN
 *   BOREDOM : EDA < FLOW_EDA_MIN (subexcitação)
 *   ANXIETY : EDA > FLOW_EDA_MAX OU HRV < FLOW_HRV_MIN (sobrecarga)
 *
 * @sheetColumns (aba Gamificacao)
 *   id | student_id | session_id | aplicacao | nivel_dificuldade |
 *   estado_fluxo | eda_value | hrv_value | eeg_ratio | created_at
 */

var GamificationController = (function() {

  /**
   * Detecta o estado de fluxo e atualiza o nível de dificuldade.
   * @param  {Object} payload  {studentId, sessionId, aplicacao, edaValue, hrvValue, eegRatio, currentDifficulty}
   * @param  {Object} session
   * @return {Object} {success, data: {newDifficulty, flowState}, error}
   */
  function updateDifficulty(payload, session) {
    try {
      try {
        try {
          var cfg = Config.GAMIFICATION;
          var eda = payload.edaValue   || 0;
          var hrv = payload.hrvValue   || 0;
          var eeg = payload.eegRatio   || 0;
          var cur = payload.currentDifficulty || 0.5;

          var flowState;
          var delta = 0;

          if (eda >= cfg.FLOW_EDA_MIN && eda <= cfg.FLOW_EDA_MAX && hrv >= cfg.FLOW_HRV_MIN) {
            flowState = 'FLOW';
            delta = cfg.DIFFICULTY_STEP; // Aumenta dificuldade gradualmente
          } else if (eda < cfg.FLOW_EDA_MIN) {
            flowState = 'BOREDOM';
            delta = cfg.DIFFICULTY_STEP; // Aumenta para estimular
          } else {
            flowState = 'ANXIETY';
            delta = -cfg.DIFFICULTY_STEP; // Reduz para aliviar
          }

          var newDifficulty = Utils.clamp(cur + delta, 0.1, 1.0);

          // Persiste o estado
          Database.appendRow(Config.SHEET_NAMES.GAMIFICATION, [
            payload.studentId,
            payload.sessionId || '',
            payload.aplicacao || '',
            newDifficulty,
            flowState,
            eda, hrv, eeg
          ]);

          return ResponseHandler.success({ newDifficulty: newDifficulty, flowState: flowState });
        } catch (err) {
          return ResponseHandler.error(err, 'GamificationController.updateDifficulty');
        }
      } catch (error) {
        Logger.log("Erro em updateDifficulty: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em updateDifficulty: " + error.message);
      throw error;
    }
  }

  /**
   * Retorna o histórico de dificuldade de um estudante em uma aplicação.
   * @param  {Object} payload  {studentId, aplicacao?}
   * @param  {Object} session
   * @return {Object} {success, data: Array, error}
   */
  function getHistory(payload, session) {
    try {
      try {
        var filters = { student_id: payload.studentId };
        if (payload.aplicacao) filters.aplicacao = payload.aplicacao;
        var history = Database.getAll(Config.SHEET_NAMES.GAMIFICATION, filters);
        return ResponseHandler.success(history);
      } catch (err) {
        return ResponseHandler.error(err, 'GamificationController.getHistory');
      }
    } catch (error) {
      Logger.log("Erro em getHistory: " + error.message);
      throw error;
    }
  }

  return { updateDifficulty: updateDifficulty, getHistory: getHistory };

})();

// Legacy alias kept for gradual migration of older calls.
var GamificationController_ = GamificationController;
