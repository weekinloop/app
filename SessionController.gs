/**
 * @file       SessionController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de sessões de monitoramento biométrico.
 *   Gerencia o ciclo de vida completo de uma sessão: início, pausa,
 *   retomada, encerramento e consulta histórica.
 *
 * @description
 *   Uma Sessão Biométrica representa um período contínuo de coleta de
 *   dados dos biossensores para um conjunto de estudantes de uma turma.
 *   Cada sessão está associada a uma aplicação específica (ex: App01 —
 *   Fluência de Leitura) e a um professor responsável. O início de uma
 *   sessão verifica se os sensores necessários estão online e calibrados.
 *   O encerramento consolida as métricas da sessão e dispara a geração
 *   de alertas pendentes via AlertController.gs.
 *
 * @integrations
 *   Code.gs                    : Rotas startSession, endSession, getSessions
 *   Database.gs                : appendRow(), getAll(), updateById()
 *   Config.gs                  : SHEET_NAMES.BIO_SESSIONS
 *   SensorController.gs        : Verifica status dos sensores antes de iniciar
 *   BiometricDataController.gs : Dados são vinculados ao sessionId
 *   AlertController.gs         : Chamado ao encerrar sessão para gerar alertas
 *   ReportController.gs        : Usa sessões para gerar relatórios
 *   SessionManager.html        : Interface de controle de sessões
 *   notebook.py                : Recebe sessionId para vincular dados enviados
 *
 * @sheetColumns (aba SessoesBiometricas)
 *   O controlador aceita o layout legado em snake_case e o layout catalogado
 *   em PascalCase, mantendo os campos de turma/aplicacao em novas colunas
 *   quando a aba existente ainda usa o segundo formato.
 *
 * @sessionStatus
 *   ativa | pausada | encerrada | erro
 */

var SessionController = (function() {
  function normalizeSessionStatus_(record) {
    try {
      if (!record) return '';
      return String(record.status || record.Status || record.STATUS || '').trim().toLowerCase();
    } catch (error) {
      Logger.log("Erro em normalizeSessionStatus_: " + error.message);
      throw error;
    }
  }

  function findSession_(sessionId) {
    if (!sessionId) return null;
    return Database.findById(Config.SHEET_NAMES.BIO_SESSIONS, sessionId);
  }

  function normalizedHeader_(header) {
    return String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function readHeaders_() {
    var sheet = Database.getSheet(Config.SHEET_NAMES.BIO_SESSIONS);
    var lastColumn = sheet.getLastColumn();
    return lastColumn > 0
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      : [];
  }

  function ensureSessionHeaders_(sheet, headers) {
    var current = headers.slice();
    if (!current.length) {
      current = ['id', 'turma_id', 'professor_id', 'aplicacao', 'inicio', 'fim',
        'status', 'num_estudantes', 'observacoes', 'created_at', 'updated_at'];
      sheet.getRange(1, 1, 1, current.length).setValues([current]);
      return current;
    }

    var required = ['turma_id', 'professor_id', 'aplicacao', 'inicio', 'fim',
      'status', 'num_estudantes', 'observacoes', 'created_at', 'updated_at'];
    var normalized = current.map(normalizedHeader_);
    var missing = required.filter(function (header) {
      return normalized.indexOf(normalizedHeader_(header)) < 0;
    });
    if (missing.length) {
      sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
      current = current.concat(missing);
    }
    return current;
  }

  function valueForSessionHeader_(header, values) {
    switch (normalizedHeader_(header)) {
      case 'id': return values.id;
      case 'turmaid': return values.turmaId;
      case 'professorid':
      case 'userid':
        return values.userId;
      case 'aplicacao':
      case 'application': return values.aplicacao;
      case 'inicio':
      case 'startedat': return values.startedAt;
      case 'fim':
      case 'endedat': return values.endedAt;
      case 'status': return values.status;
      case 'numestudantes':
      case 'studentcount': return values.studentCount;
      case 'observacoes':
      case 'notes': return values.notes;
      case 'createdat': return values.createdAt;
      case 'updatedat': return values.updatedAt;
      case 'subjectid': return '';
      default: return '';
    }
  }

  function appendSession_(values) {
    var row = [
      values.id,
      values.turmaId,
      values.userId,
      values.aplicacao,
      values.startedAt,
      values.endedAt,
      values.studentCount,
      values.status,
      values.notes,
      values.createdAt,
      values.updatedAt
    ];
    if (typeof Database !== 'undefined' && typeof Database.appendRow === 'function') {
      try {
        Database.appendRow(Config.SHEET_NAMES.BIO_SESSIONS, row);
        return values.id;
      } catch (e) {
        // fallback para manipulacao direta da sheet
      }
    }
    var lock = typeof LockService !== 'undefined' ? LockService.getScriptLock() : null;
    if (lock && !lock.tryLock(10000)) throw new Error('Nao foi possivel obter lock para appendSession.');
    try {
      var sheet = Database.getSheet(Config.SHEET_NAMES.BIO_SESSIONS);
      var headers = readHeaders_();
      headers = ensureSessionHeaders_(sheet, headers);
      sheet.appendRow(headers.map(function (header) {
        return valueForSessionHeader_(header, values);
      }));
      return values.id;
    } finally {
      if (lock) lock.releaseLock();
    }
  }

  function updateSession_(sessionId, values) {
    var headers = readHeaders_();
    var updates = {};
    headers.forEach(function (header) {
      var key = normalizedHeader_(header);
      if (key === 'fim' || key === 'endedat') updates[header] = values.endedAt;
      if (key === 'status') updates[header] = values.status;
      if (key === 'updatedat') updates[header] = values.updatedAt;
      if ((key === 'observacoes' || key === 'notes') && values.notes !== undefined) {
        updates[header] = values.notes;
      }
    });
    return Database.updateById(Config.SHEET_NAMES.BIO_SESSIONS, sessionId, updates);
  }

  function firstField_(record, aliases) {
    for (var i = 0; i < aliases.length; i++) {
      var key = aliases[i];
      if (record && record[key] !== undefined && record[key] !== null && record[key] !== '') {
        return record[key];
      }
    }
    return '';
  }

  function sessionOwner_(record) {
    return String(firstField_(record, ['professor_id', 'professorId', 'UserID', 'user_id', 'userId']) || '').trim();
  }

  function canManageSession_(record, session) {
    var role = String(session && session.role || '').trim().toLowerCase();
    if (role === 'admin') return true;
    var owner = sessionOwner_(record);
    return !!owner && !!session && String(session.userId || '').trim() === owner;
  }

  function normalizeSessionRecord_(record) {
    if (!record) return record;
    var result = Object.assign({}, record);
    result.turma_id = firstField_(record, ['turma_id', 'turmaId', 'TurmaID']);
    result.professor_id = sessionOwner_(record);
    result.aplicacao = firstField_(record, ['aplicacao', 'application', 'Application']);
    result.inicio = firstField_(record, ['inicio', 'started_at', 'StartedAt']);
    result.fim = firstField_(record, ['fim', 'ended_at', 'EndedAt']);
    result.status = normalizeSessionStatus_(record);
    result.num_estudantes = firstField_(record, ['num_estudantes', 'studentCount', 'StudentCount']);
    result.observacoes = firstField_(record, ['observacoes', 'notes', 'Notes']);
    return result;
  }

  function requireActiveSession(payload) {
    var validation = ValidationService.requireFields(payload || {}, ['sessionId']);
    if (!validation.success) return validation;

    var record = findSession_(payload.sessionId);
    if (!record || normalizeSessionStatus_(record) !== Constants.SESSION_STATUS.ACTIVE) {
      LoggerService.warn('SessionController.requireActiveSession', Constants.ERROR_MESSAGES.SESSION_NOT_ACTIVE, {
        sessionId: payload.sessionId,
        status: normalizeSessionStatus_(record)
      });
      return StandardReturn.fail(Constants.ERROR_MESSAGES.SESSION_NOT_ACTIVE);
    }

    return StandardReturn.ok({ sessionId: payload.sessionId, session: record });
  }

  function requireOwnedActiveSession(payload, session) {
    var active = requireActiveSession(payload);
    if (!active.success) return active;
    if (!canManageSession_(active.data.session, session)) {
      return StandardReturn.fail(Constants.ERROR_MESSAGES.PERMISSION_DENIED);
    }
    return active;
  }

  /**
   * Inicia uma nova sessão biométrica.
   * @param  {Object} payload  {turmaId, professorId, aplicacao, observacoes}
   * @param  {Object} session
   * @return {Object} {success, data: {sessionId}, error}
   */
  function start(payload, session) {
    try {
      try {
        try {
          payload = payload || {};
          if (!session || !String(session.userId || '').trim()) {
            return ResponseHandler.error(Constants.ERROR_MESSAGES.SESSION_INVALID);
          }
          var validation = ValidationService.requireFields(payload, ['turmaId', 'aplicacao']);
          if (!validation.success) return validation;

          var acknowledged = payload.consentAcknowledged === true ||
            String(payload.consentAcknowledged || '').toLowerCase() === 'true' ||
            String(payload.consentAcknowledged || '').toLowerCase() === 'on';
          if (!acknowledged) {
            return ResponseHandler.error(
              'Confirme que os consentimentos correspondem à atividade e às finalidades selecionadas.',
              'CONSENT_ACK_REQUIRED'
            );
          }

          var subjectIds = Array.isArray(payload.subjectIds) ? payload.subjectIds : [];
          subjectIds = subjectIds.map(function(id) { return String(id || '').trim(); })
            .filter(function(id, index, all) { return id && all.indexOf(id) === index; });
          if (!subjectIds.length || subjectIds.length > 40) {
            return ResponseHandler.error(
              'Selecione entre 1 e 40 estudantes com consentimento válido.',
              'CONSENT_SCOPE_REQUIRED'
            );
          }

          var missing = [];
          subjectIds.forEach(function(subjectId) {
            ['collect', 'pedagogy'].forEach(function(purpose) {
              try { ConsentService.check(subjectId, purpose); }
              catch (error) { missing.push({ subjectHash: ConsentService._hash(subjectId), purpose: purpose, status: error.status || 'invalid' }); }
            });
          });
          if (missing.length) {
            return ResponseHandler.error({
              message: 'Sessão bloqueada: há consentimentos ausentes, expirados ou revogados.',
              missing: missing
            }, 'CONSENT_REQUIRED');
          }

          var now = new Date().toISOString();
          var id = (typeof Utils !== 'undefined' && Utils && typeof Utils.generateUUID === 'function')
            ? Utils.generateUUID()
            : ('sess_' + new Date().getTime());
          appendSession_({
            id: id,
            turmaId: String(payload.turmaId).trim(),
            userId: String(session.userId).trim(),
            aplicacao: String(payload.aplicacao).trim(),
            startedAt: now,
            endedAt: '',
            status: Constants.SESSION_STATUS.ACTIVE,
            studentCount: subjectIds.length,
            notes: String(payload.observacoes || '').trim(),
            createdAt: now,
            updatedAt: now
          });
          LoggerService.info('SessionController.start', 'Sessão iniciada: ' + id);
          return ResponseHandler.success({ sessionId: id });
        } catch (err) {
          return ResponseHandler.error(err, 'SessionController.start');
        }
      } catch (error) {
        Logger.log("Erro em start: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em start: " + error.message);
      throw error;
    }
  }

  /**
   * Encerra uma sessão biométrica ativa.
   * Dispara a geração de alertas para os dados coletados.
   * @param  {Object} payload  {sessionId, observacoes?}
   * @param  {Object} session
   * @return {Object} {success, data, error}
   */
  function end(payload, session) {
    try {
      try {
        var activeSession = requireOwnedActiveSession(payload, session);
        if (!activeSession.success) return activeSession;

        var endedAt = new Date().toISOString();
        var updates = {
          endedAt: endedAt,
          status : Constants.SESSION_STATUS.CLOSED,
          updatedAt: endedAt,
          notes  : payload.observacoes ? String(payload.observacoes).trim() : undefined
        };

        var ok = updateSession_(payload.sessionId, updates);
        if (!ok) return ResponseHandler.error(Constants.ERROR_MESSAGES.notFound('Sessão'));

        // Dispara análise de alertas para a sessão encerrada
        AlertController.analyzeSession(payload.sessionId);

        LoggerService.info('SessionController.end', 'Sessão encerrada: ' + payload.sessionId);
        return ResponseHandler.success(null);
      } catch (err) {
        return ResponseHandler.error(err, 'SessionController.end');
      }
    } catch (error) {
      Logger.log("Erro em end: " + error.message);
      throw error;
    }
  }

  /**
   * Lista sessões com filtros opcionais.
   * @param  {Object} payload  {turmaId?, status?, aplicacao?}
   * @param  {Object} session
   * @return {Object} {success, data: Array<Session>, error}
   */
  function list(payload, session) {
    try {
      try {
        payload = payload || {};
        var sessions = Database.getAll(Config.SHEET_NAMES.BIO_SESSIONS, null)
          .map(normalizeSessionRecord_)
          .filter(function (item) {
            if (payload.turmaId && String(item.turma_id) !== String(payload.turmaId)) return false;
            if (payload.status && item.status !== String(payload.status).trim().toLowerCase()) return false;
            if (payload.aplicacao && String(item.aplicacao) !== String(payload.aplicacao)) return false;
            return true;
          });
        return ResponseHandler.success(sessions);
      } catch (err) {
        return ResponseHandler.error(err, 'SessionController.list');
      }
    } catch (error) {
      Logger.log("Erro em list: " + error.message);
      throw error;
    }
  }

  return {
    start: start,
    end: end,
    list: list,
    requireActiveSession: requireActiveSession,
    requireOwnedActiveSession: requireOwnedActiveSession
  };

})();

// Legacy alias kept for gradual migration of older calls.
var SessionController_ = SessionController;
