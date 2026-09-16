/**
 * @file       ClassController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de CRUD para a entidade Turma.
 *   Gerencia o cadastro e consulta de turmas escolares na aba "Turmas"
 *   da planilha Google Sheets principal.
 *
 * @description
 *   Uma Turma agrupa estudantes de uma mesma série/ano letivo sob a
 *   responsabilidade de um ou mais professores. Os dados biométricos
 *   coletados durante sessões de monitoramento são sempre associados
 *   a uma turma específica, permitindo análises comparativas entre
 *   turmas e acompanhamento longitudinal ao longo do ano letivo.
 *
 * @integrations
 *   Code.gs              : Rotas createClass, getClasses
 *   Database.gs          : appendRow(), getAll()
 *   Config.gs            : SHEET_NAMES.CLASSES
 *   StudentController.gs : Associa estudantes a turmas via turma_id
 *   TeacherController.gs : Associa professores a turmas
 *   SessionController.gs : Sessões biométricas são vinculadas a turmas
 *   ClassesView.html     : Interface de gestão de turmas
 *
 * @sheetColumns (aba Turmas)
 *   id | nome | serie | ano_letivo | professor_id | sala | turno |
 *   ativo | created_at | updated_at
 */

var ClassController = (function() {

  function create(payload, session) {
    try {
      var nome = Utils.sanitizeString(payload.nome);
      if (!nome) return ResponseHandler.error(Constants.ERROR_MESSAGES.requiredFields(['Nome da turma']));

      var id = Database.appendRow(Config.SHEET_NAMES.CLASSES, [
        nome,
        payload.serie || '',
        payload.anoLetivo || new Date().getFullYear(),
        payload.professorId || '',
        payload.sala || '',
        payload.turno || 'Manhã',
        true
      ]);
      return ResponseHandler.success({ classId: id });
    } catch (err) {
      return ResponseHandler.error(err, 'ClassController.create');
    }
  }

  function list(payload, session) {
    try {
      var filters = { ativo: true };
      if (payload.anoLetivo) filters.ano_letivo = payload.anoLetivo;
      var classes = Database.getAll(Config.SHEET_NAMES.CLASSES, filters);
      return ResponseHandler.success(classes);
    } catch (err) {
      return ResponseHandler.error(err, 'ClassController.list');
    }
  }

  return { create: create, list: list };

})();

// Legacy alias kept for gradual migration of older calls.
var ClassController_ = ClassController;
