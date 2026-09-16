/**
 * @file       TeacherController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de CRUD para a entidade Professor.
 *   Gerencia cadastro, consulta, atualização e remoção de professores
 *   na aba "Professores" da planilha Google Sheets principal.
 *
 * @description
 *   Professores são os usuários primários do sistema em sala de aula.
 *   Cada professor pode ser associado a múltiplas turmas e tem acesso
 *   aos dados biométricos dos estudantes de suas turmas. O perfil do
 *   professor também registra sua formação em neuro-educação, o que
 *   pode influenciar o nível de detalhe dos alertas e relatórios exibidos.
 *
 * @integrations
 *   Code.gs              : Rotas createTeacher, getTeachers, updateTeacher,
 *                          deleteTeacher
 *   Database.gs          : appendRow(), getAll(), findById(), updateById(),
 *                          deleteById()
 *   Config.gs            : SHEET_NAMES.TEACHERS
 *   Auth.gs              : Cria usuário de acesso ao sistema para o professor
 *   ClassController.gs   : Associa professor a turmas
 *   TeachersView.html    : Interface de gestão de professores
 *
 * @sheetColumns (aba Professores)
 *   id | nome | email | disciplinas | formacao_neuroeducacao |
 *   user_id | ativo | created_at | updated_at
 */

var TeacherController = (function() {

  function create(payload, session) {
    try {
      var nome = Utils.sanitizeString(payload.nome);
      if (!nome) return ResponseHandler.error(Constants.ERROR_MESSAGES.requiredFields(['Nome do professor']));
      if (!Utils.isValidEmail(payload.email)) return ResponseHandler.error(Constants.ERROR_MESSAGES.INVALID_EMAIL);

      var id = Database.appendRow(Config.SHEET_NAMES.TEACHERS, [
        nome,
        payload.email,
        payload.disciplinas || '',
        payload.formacaoNeuroeducacao || 'Básico',
        payload.userId || '',
        true
      ]);
      return ResponseHandler.success({ teacherId: id });
    } catch (err) {
      return ResponseHandler.error(err, 'TeacherController.create');
    }
  }

  function list(payload, session) {
    try {
      var teachers = Database.getAll(Config.SHEET_NAMES.TEACHERS, { ativo: true });
      return ResponseHandler.success(teachers);
    } catch (err) {
      return ResponseHandler.error(err, 'TeacherController.list');
    }
  }

  function update(payload, session) {
    try {
      try {
        var updates = {};
        if (payload.nome)                   updates.nome = Utils.sanitizeString(payload.nome);
        if (payload.email)                  updates.email = payload.email;
        if (payload.disciplinas)            updates.disciplinas = payload.disciplinas;
        if (payload.formacaoNeuroeducacao)  updates.formacao_neuroeducacao = payload.formacaoNeuroeducacao;

        var ok = Database.updateById(Config.SHEET_NAMES.TEACHERS, payload.teacherId, updates);
        if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Professor'));
        return ResponseHandler.success(null);
      } catch (err) {
        return ResponseHandler.error(err, 'TeacherController.update');
      }
    } catch (error) {
      Logger.log("Erro em update: " + error.message);
      throw error;
    }
  }

  function remove(payload, session) {
    try {
      // Apenas admin pode remover professores
      if (session.role !== 'admin') {
        return ResponseHandler.error(Constants.ERROR_MESSAGES.PERMISSION_DENIED);
      }
      var ok = Database.deleteById(Config.SHEET_NAMES.TEACHERS, payload.teacherId);
      if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Professor'));
      return ResponseHandler.success(null);
    } catch (err) {
      return ResponseHandler.error(err, 'TeacherController.remove');
    }
  }

  return { create: create, list: list, update: update, remove: remove };

})();

// Legacy alias kept for gradual migration of older calls.
var TeacherController_ = TeacherController;
