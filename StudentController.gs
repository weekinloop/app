/**
 * @file       StudentController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de CRUD para a entidade Estudante.
 *   Gerencia o cadastro, consulta, atualização e remoção de estudantes
 *   na aba "Estudantes" da planilha Google Sheets principal.
 *
 * @description
 *   Cada estudante possui um perfil completo com dados demográficos,
 *   série/ano, informações de contato dos responsáveis e flags de
 *   condições especiais (TDAH, Dislexia, TEA, etc.) que influenciam
 *   os limiares de alerta biométrico configurados em AlertController.gs.
 *   O perfil do estudante é o nó central que conecta todos os dados
 *   biométricos, intervenções e relatórios do sistema.
 *
 * @integrations
 *   Code.gs              : Rotas createStudent, getStudents, updateStudent,
 *                          deleteStudent, getStudentById
 *   Database.gs          : appendRow(), getAll(), findById(), updateById(),
 *                          deleteById()
 *   Config.gs            : SHEET_NAMES.STUDENTS
 *   Utils.gs             : sanitizeString(), isValidEmail()
 *   AlertController.gs   : Lê perfil do estudante para calibrar limiares
 *   ReportController.gs  : Agrega dados do estudante em relatórios
 *   StudentProfile.html  : Interface de visualização do perfil
 *   StudentsView.html    : Tabela e formulário de cadastro
 *
 * @sheetColumns (aba Estudantes)
 *   id | nome | data_nascimento | serie | turma_id | responsavel_nome |
 *   responsavel_email | condicoes_especiais | ativo | created_at | updated_at
 */

var StudentController = (function() {

  /**
   * Cria um novo estudante.
   * @param  {Object} payload  {nome, dataNascimento, serie, turmaId,
   *                            responsavelNome, responsavelEmail, condicoesEspeciais}
   * @param  {Object} session
   * @return {Object} {success, data: {studentId}, error}
   */
  function create(payload, session) {
    try {
      var nome = Utils.sanitizeString(payload.nome);
      if (!nome) return ResponseHandler.error(Constants.ERROR_MESSAGES.requiredFields(['Nome do estudante']));

      var id = Database.appendRow(Config.SHEET_NAMES.STUDENTS, [
        nome,
        payload.dataNascimento || '',
        payload.serie || '',
        payload.turmaId || '',
        Utils.sanitizeString(payload.responsavelNome || ''),
        payload.responsavelEmail || '',
        payload.condicoesEspeciais || '',
        true  // ativo
      ]);
      return ResponseHandler.success({ studentId: id });
    } catch (err) {
      return ResponseHandler.error(err, 'StudentController.create');
    }
  }

  /**
   * Lista todos os estudantes ativos, com filtros opcionais.
   * @param  {Object} payload  {turmaId?, serie?}
   * @param  {Object} session
   * @return {Object} {success, data: Array<Student>, error}
   */
  function list(payload, session) {
    try {
      try {
        var filters = { ativo: true };
        if (payload.turmaId) filters.turma_id = payload.turmaId;
        if (payload.serie)   filters.serie    = payload.serie;
        var students = Database.getAll(Config.SHEET_NAMES.STUDENTS, filters);
        return ResponseHandler.success(students);
      } catch (err) {
        return ResponseHandler.error(err, 'StudentController.list');
      }
    } catch (error) {
      Logger.log("Erro em list: " + error.message);
      throw error;
    }
  }

  /**
   * Busca um estudante pelo ID.
   * @param  {Object} payload  {studentId}
   * @param  {Object} session
   * @return {Object} {success, data: Student, error}
   */
  function getById(payload, session) {
    try {
      var student = Database.findById(Config.SHEET_NAMES.STUDENTS, payload.studentId);
      if (!student) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Estudante'));
      return ResponseHandler.success(student);
    } catch (err) {
      return ResponseHandler.error(err, 'StudentController.getById');
    }
  }

  /**
   * Atualiza dados de um estudante.
   * @param  {Object} payload  {studentId, ...camposAAtualizar}
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function update(payload, session) {
    try {
      var updates = {};
      if (payload.nome)               updates.nome               = Utils.sanitizeString(payload.nome);
      if (payload.serie)              updates.serie              = payload.serie;
      if (payload.turmaId)            updates.turma_id           = payload.turmaId;
      if (payload.responsavelNome)    updates.responsavel_nome   = Utils.sanitizeString(payload.responsavelNome);
      if (payload.responsavelEmail)   updates.responsavel_email  = payload.responsavelEmail;
      if (payload.condicoesEspeciais) updates.condicoes_especiais = payload.condicoesEspeciais;

      var ok = Database.updateById(Config.SHEET_NAMES.STUDENTS, payload.studentId, updates);
      if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Estudante'));
      return ResponseHandler.success(null);
    } catch (err) {
      return ResponseHandler.error(err, 'StudentController.update');
    }
  }

  /**
   * Realiza soft delete de um estudante (marca ativo = false).
   * Apenas admin e coordenador podem remover estudantes.
   * @param  {Object} payload  {studentId}
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function remove(payload, session) {
    try {
      if (session.role !== 'admin' && session.role !== 'coordenador') {
        return ResponseHandler.error(Constants.ERROR_MESSAGES.PERMISSION_DENIED);
      }
      var ok = Database.deleteById(Config.SHEET_NAMES.STUDENTS, payload.studentId);
      if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Estudante'));
      return ResponseHandler.success(null);
    } catch (err) {
      return ResponseHandler.error(err, 'StudentController.remove');
    }
  }

  return { create: create, list: list, getById: getById, update: update, remove: remove };

})();

// Legacy alias kept for gradual migration of older calls.
var StudentController_ = StudentController;
