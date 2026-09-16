/**
 * @file       InterventionController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de registro e consulta de intervenções pedagógicas.
 *   Documenta as ações tomadas pelo professor em resposta a alertas
 *   biométricos, criando um histórico de práticas eficazes.
 *
 * @description
 *   Cada intervenção é vinculada ao alerta que a originou, ao estudante
 *   e à sessão em que ocorreu. O registro inclui o tipo de intervenção
 *   (ex: respiração, pausa, simplificação da tarefa), a duração e a
 *   avaliação subjetiva do professor sobre a eficácia. Com o acúmulo
 *   de dados, o sistema pode identificar quais intervenções são mais
 *   eficazes para cada perfil biométrico de estudante.
 *
 * ⚠️ REVISÃO HUMANA OBRIGATÓRIA (fundamentos.md 3.3.5.4):
 *   Qualquer sugestão de alerta ou intervenção gerada por IA deve passar por
 *   aprovação humana (professor ou responsável pedagógico) ANTES de ser registrada
 *   ou comunicada. Este controlador registra intervenções APÓS aprovação — nunca
 *   automaticamente a partir de sugestões de IA sem validação pedagógica.
 *   
 *   Fluxo obrigatório:
 *   1. Alerta gerado (automaticamente ou via IA)
 *   2. Sugestão de intervenção apresentada como RASCUNHO ao professor
 *   3. Professor revisa, adapta ou rejeita a sugestão
 *   4. Apenas intervenções APROVADAS pelo professor são registradas via log()
 *   5. Campo approvedBy documenta quem autorizou o registro
 *
 * @integrations
 *   Code.gs              : Rotas logIntervention, getInterventions
 *   Database.gs          : appendRow(), getAll()
 *   Config.gs            : SHEET_NAMES.INTERVENTIONS
 *   AlertController.gs   : Alertas resolvidos geram sugestões de intervenção
 *   ReportController.gs  : Intervenções são incluídas nos relatórios
 *   InterventionsLog.html: Interface de registro e histórico
 *
 * @interventionTypes
 *   respiracao_diafragmatica | pausa_ativa | simplificacao_tarefa |
 *   andaime_cognitivo | reforco_positivo | mudanca_metodologia |
 *   encaminhamento_especialista | outro
 *
 * @sheetColumns (aba Intervencoes)
 *   id | alert_id | student_id | session_id | professor_id | tipo |
 *   descricao | duracao_min | eficacia_percebida | approved_by | created_at | updated_at
 */

var InterventionController = (function() {

  function log(payload, session) {
    try {
      var validation = ValidationService.requireFields(payload, ['studentId', 'tipo']);
      if (!validation.success) return validation;

      // Validação: registro de intervenção exige aprovação humana explícita
      if (!payload.approvedBy && !session.userId) {
        return ResponseHandler.error(
          new Error('BLOQUEIO DE REVISÃO HUMANA: Registro de intervenção exige aprovação explícita do professor ou responsável pedagógico. ' +
                    'Forneça approvedBy ou autentique-se antes de registrar.')
        );
      }

      var approvedBy = payload.approvedBy || session.userId;

      var id = Database.appendRow(Config.SHEET_NAMES.INTERVENTIONS, [
        payload.alertId    || '',
        payload.studentId,
        payload.sessionId  || '',
        session.userId,
        payload.tipo,
        Utils.sanitizeString(payload.descricao || ''),
        payload.duracaoMin || 0,
        payload.eficaciaPercebida || 3,  // Escala 1-5
        approvedBy  // Documenta quem autorizou o registro
      ]);
      
      LoggerService.info('InterventionController.log', 
        'Intervenção registrada: ' + payload.tipo + ' para estudante ' + payload.studentId + 
        ' (aprovada por: ' + approvedBy + ')');
      
      return ResponseHandler.success({ interventionId: id, approvedBy: approvedBy });
    } catch (err) {
      return ResponseHandler.error(err, 'InterventionController.log');
    }
  }

  function list(payload, session) {
    try {
      var filters = {};
      if (payload.studentId) filters.student_id = payload.studentId;
      if (payload.sessionId) filters.session_id = payload.sessionId;
      var interventions = Database.getAll(Config.SHEET_NAMES.INTERVENTIONS, filters);
      return ResponseHandler.success(interventions);
    } catch (err) {
      return ResponseHandler.error(err, 'InterventionController.list');
    }
  }

  return { log: log, list: list };

})();

// Legacy alias kept for gradual migration of older calls.
var InterventionController_ = InterventionController;
