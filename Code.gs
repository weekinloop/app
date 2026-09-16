/**
 * @file       Code.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Ponto de entrada principal do Web App Google Apps Script.
 *   Expõe doGet() (serve a UI HTML) e doPost() (API REST interna).
 *
 * @description
 *   Roteador central do sistema. Toda requisição HTTP passa por aqui antes
 *   de ser delegada ao controlador correto. O Google Colab (notebook.py)
 *   envia dados biométricos via POST; o navegador acessa a UI via GET.
 *
 * @integrations
 *   Auth.gs, Config.gs, Database.gs, StudentController.gs,
 *   TeacherController.gs, ClassController.gs, SensorController.gs,
 *   SessionController.gs, BiometricDataController.gs, AlertController.gs,
 *   ReportController.gs, InterventionController.gs, GamificationController.gs,
 *   Index.html
 *
 * @routes  (campo "action" no payload JSON do POST)
 *   login, createStudent, getStudents, updateStudent, deleteStudent,
 *   createTeacher, getTeachers, updateTeacher, deleteTeacher,
 *   createClass, getClasses, registerSensor, getSensors,
 *   startSession, endSession, getSessions,
 *   saveBiometric, getBiometric,
 *   getAlerts, resolveAlert, generateReport,
 *   logIntervention, getInterventions, updateDifficulty
 *
 * @security
 *   Todas as rotas (exceto login) exigem token de sessão válido
 *   verificado pelo serviço canônico em ScriptProperties.
 *
 * @gasPermissions
 *   spreadsheets (leitura/escrita), script.external_request
 */

function doGet(e) {
  // FLEET_FRAGMENT_BOOTSTRAP: o token fica no fragmento (#tok=), que não é
  // enviado ao servidor. O shell valida o token antes de chamar qualquer API.
  var fleetBootstrapPage = e && e.parameter && String(e.parameter.page || '') === 'app';
  var fleetBootstrapToken = e && e.parameter && e.parameter.tok;
  if (fleetBootstrapPage && !fleetBootstrapToken) {
    var fleetTemplates = ['Index', 'index', 'Dashboard'];
    for (var fleetI = 0; fleetI < fleetTemplates.length; fleetI++) {
      try {
        var fleetTemplate = HtmlService.createTemplateFromFile(fleetTemplates[fleetI]);
        fleetTemplate.authToken = '';
        fleetTemplate.tok = '';
        fleetTemplate.sessionUser = {};
        fleetTemplate.data = { scriptUrl: ScriptApp.getService().getUrl() };
        return fleetTemplate.evaluate()
          .setTitle('WeekInLoop - Biometria nos anos iniciais')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      } catch (fleetTemplateError) {
        // Template alternativo não disponível - fallback para mensagem genérica
      }
    }
    return HtmlService.createHtmlOutput('Aplicação indisponível.');
  }
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    template.appVersion = Config.APP_VERSION;
    return template.evaluate()
      .setTitle(Config.APP_TITLE)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    LoggerService.error('Code.doGet', err);
    return HtmlService.createHtmlOutput('<h2>Erro ao carregar o sistema.</h2><p>Tente novamente em instantes ou acione o suporte.</p>');
  }
}

/**
 * Avalia um fragmento HTML dentro do template principal.
 * @param {string} filename Nome do arquivo sem extensão.
 * @return {string}
 */
function include(filename) {
  var template = HtmlService.createTemplateFromFile(filename);
  template.appVersion = Config.APP_VERSION;
  return template.evaluate().getContent();
}

/**
 * Compacta dados estáticos para uso em data URLs (como logos base64)
 * Remove todos os espaços em branco para otimizar o tamanho
 */
function includeInlineData(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent().replace(/\s+/g, '');
}

/**
 * Entrada única usada pelo frontend via google.script.run.
 * Diferente de doPost(), retorna um objeto JavaScript serializável.
 *
 * @param {Object|string} request {action, token, ...payload}
 * @return {Object} {status, timestamp, data, message}
 */
function apiRequest(request) {
  try {
    var payload = request;
    try {
      if (typeof payload === 'string') payload = JSON.parse(payload);
      payload = payload || {};
      var action = payload.action || '';

      if (action === 'login') {
        return ResponseHandler.normalize(_login(payload.username, payload.password));
      }

      var session = _verifySession(payload.token);
      if (!session.valid) {
        var invalid = ResponseHandler.error(Constants.ERROR_MESSAGES.SESSION_INVALID);
        // O frontend (Index.html api()) volta ao login quando code === 'SESSION_INVALID'.
        invalid.code = 'SESSION_INVALID';
        return invalid;
      }

      if (action === 'sessionInfo') {
        return ResponseHandler.success(session);
      }
      if (action === 'logout') {
        return ResponseHandler.normalize(_logout(payload.token));
      }

      return ResponseHandler.normalize(_dispatch(action, payload, session));
    } catch (err) {
      return ResponseHandler.error(err, 'Code.apiRequest');
    }
  } catch (error) {
    Logger.log("Erro em apiRequest: " + error.message);
    throw error;
  }
}

/**
 * Login: caminho canônico por token em ScriptProperties via AuthStandardService.
 * Isso evita o vazamento de sessão em "Execute as: Me" e dispensa a aba
 * SessoesAuth.
 * @return {Object} envelope ResponseHandler com data {token,userId,role,username}.
 */
function _login(username, password) {
  if (typeof AuthStd_loginWithToken_ === 'function') {
    var r = AuthStd_loginWithToken_(username, password);
    if (r && r.success) {
      var u = r.user || {};
      return ResponseHandler.success({
        token: r.token,
        userId: u.id || u.userId || '',
        role: u.role || 'professor',
        username: u.username || username
      });
    }
    if (r && r.message) return ResponseHandler.error(r.message);
  }
  return ResponseHandler.error('Serviço de autenticação indisponível.');
}

/** Valida o token exclusivamente contra o armazenamento canônico. */
function _verifySession(token) {
  if (typeof AuthStd_getSession_ !== 'function') return { valid: false };
  var s = AuthStd_getSession_(token);
  return s && s.valid ? s : { valid: false };
}

/** Revoga o token no armazenamento canônico. */
function _logout(token) {
  if (typeof AuthStd_logoutWithToken_ === 'function') {
    try { return AuthStd_logoutWithToken_(token); } catch (e) {}
  }
  return ResponseHandler.success(null);
}

function doPost(e) {
  try {
    var response = ResponseHandler.error(Constants.ERROR_MESSAGES.INTERNAL_ERROR);
    try {
      var payload = JSON.parse(e.postData.contents);
      response = apiRequest(payload);
    } catch (err) {
      response = ResponseHandler.error(err, 'Code.doPost');
    }
    return _jsonOutput(response);
  } catch (error) {
    Logger.log("Erro em doPost: " + error.message);
    throw error;
  }
}

/**
 * Configura as políticas de acesso do IamGuard para este dispatcher.
 * Chamado uma vez por execução (idempotente por sobrescrever as políticas).
 * A sessão já foi validada pelo armazenamento canônico antes de chegar aqui,
 * então passamos o objeto session diretamente como credential.
 * @private
 */
function _configureIamGuard_() {
  IamGuard.configure({
    // Sessão já resolvida: credential IS the session object.
    resolveSession: function(credential) { return credential; },
    policies: {
      // Leituras comuns a qualquer usuário autenticado.
      'getDashboard'      : {},
      'getStudentOverview': {},
      'getApplicationData': {},
      'getAiInsights'     : {},
      'getFocusProfile'   : {},
      'getReadingPattern' : {},
      // Gestão pedagógica: professor e administrador.
      'createStudent'     : { rolesAny: ['admin', 'professor'] },
      'getStudents'       : {},
      'updateStudent'     : { rolesAny: ['admin', 'professor'] },
      'deleteStudent'     : { rolesAny: ['admin'] },
      'getStudentById'    : {},
      // Cadastro de profissionais e infraestrutura: somente administrador.
      'createTeacher'     : { rolesAny: ['admin'] },
      'getTeachers'       : { rolesAny: ['admin'] },
      'updateTeacher'     : { rolesAny: ['admin'] },
      'deleteTeacher'     : { rolesAny: ['admin'] },
      'createClass'       : { rolesAny: ['admin', 'professor'] },
      'getClasses'        : {},
      'registerSensor'    : { rolesAny: ['admin'] },
      'getSensors'        : {},
      'startSession'      : { rolesAny: ['admin', 'professor'] },
      'endSession'        : { rolesAny: ['admin', 'professor'] },
      'getSessions'       : {},
      'saveBiometric'     : { rolesAny: ['admin', 'professor'] },
      'getBiometric'      : { rolesAny: ['admin', 'professor'] },
      'getAlerts'         : {},
      'resolveAlert'      : { rolesAny: ['admin', 'professor'] },
      'generateReport'    : { rolesAny: ['admin', 'professor'] },
      'logIntervention'   : { rolesAny: ['admin', 'professor'] },
      'getInterventions'  : {},
      'updateDifficulty'  : { rolesAny: ['admin', 'professor'] },
      // Rotas restritas por role.
      'getSettings'       : { rolesAny: ['admin'] }
    }
  });
}

function _dispatch(action, payload, session) {
  try {
    // O legado gravou papéis com capitalizações diferentes (Admin/admin).
    // Normalize antes de aplicar as políticas para evitar negação ou bypass
    // decorrente de comparação textual inconsistente.
    session = session || {};
    session.role = String(session.role || '').toLowerCase().trim();
    _configureIamGuard_();
    var routes = {
      'getDashboard'      : function() { return _getDashboard(payload, session); },
      'getSettings'       : function() { return _getSettings(payload, session); },
      'getStudentOverview': function() { return _getStudentOverview(payload, session); },
      'getApplicationData': function() { return _getApplicationData(payload, session); },
      'getAiInsights'     : function() { return AIService.generateInsights(payload, session); },
      'getFocusProfile'   : function() { return AIService.generateFocusProfile(payload, session); },
      'getReadingPattern' : function() { return AIService.generateReadingPattern(payload, session); },
      'createStudent'    : function() { return StudentController.create(payload, session); },
      'getStudents'      : function() { return StudentController.list(payload, session); },
      'updateStudent'    : function() { return StudentController.update(payload, session); },
      'deleteStudent'    : function() { return StudentController.remove(payload, session); },
      'getStudentById'   : function() { return StudentController.getById(payload, session); },
      'createTeacher'    : function() { return TeacherController.create(payload, session); },
      'getTeachers'      : function() { return TeacherController.list(payload, session); },
      'updateTeacher'    : function() { return TeacherController.update(payload, session); },
      'deleteTeacher'    : function() { return TeacherController.remove(payload, session); },
      'createClass'      : function() { return ClassController.create(payload, session); },
      'getClasses'       : function() { return ClassController.list(payload, session); },
      'registerSensor'   : function() { return SensorController.register(payload, session); },
      'getSensors'       : function() { return SensorController.list(payload, session); },
      'startSession'     : function() { return SessionController.start(payload, session); },
      'endSession'       : function() { return SessionController.end(payload, session); },
      'getSessions'      : function() { return SessionController.list(payload, session); },
      'saveBiometric'    : function() { return BiometricDataController.save(payload, session); },
      'getBiometric'     : function() { return BiometricDataController.query(payload, session); },
      'getAlerts'        : function() { return AlertController.getAlerts(payload, session); },
      'resolveAlert'     : function() { return AlertController.resolve(payload, session); },
      'generateReport'   : function() { return ReportController.generate(payload, session); },
      'logIntervention'  : function() { return InterventionController.log(payload, session); },
      'getInterventions' : function() { return InterventionController.list(payload, session); },
      'updateDifficulty' : function() { return GamificationController.updateDifficulty(payload, session); }
    };
    if (routes[action]) {
      return IamGuard.guard(action, session, function(principal) {
        return routes[action]();
      });
    }
    return ResponseHandler.error(Constants.ERROR_MESSAGES.unknownAction(action));
  } catch (error) {
    Logger.log("Erro em _dispatch: " + error.message);
    throw error;
  }
}

function _dataOrEmpty(response) {
  return ResponseHandler.dataOf(response, []) || [];
}

function _getDashboard(payload, session) {
  try {
    var students = _dataOrEmpty(StudentController.list({}, session));
    var teachers = _dataOrEmpty(TeacherController.list({}, session));
    var classes  = _dataOrEmpty(ClassController.list({}, session));
    var sensors  = _dataOrEmpty(SensorController.list({}, session));
    var sessions = _dataOrEmpty(SessionController.list({}, session));
    var alerts   = _dataOrEmpty(AlertController.getAlerts({ status: Constants.ALERT_STATUS.PENDING }, session));
    var activeSessions = sessions.filter(function(item) { return item.status === Constants.SESSION_STATUS.ACTIVE; });
    var onlineSensors = sensors.filter(function(item) { return item.status === 'online'; });
    var criticalAlerts = alerts.filter(function(item) { return item.severidade === Constants.ALERT_SEVERITY.CRITICAL; });

    return ResponseHandler.success({
      metrics: {
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        sensorsOnline: onlineSensors.length,
        activeSessions: activeSessions.length,
        pendingAlerts: alerts.length,
        criticalAlerts: criticalAlerts.length
      },
      activeSessions: activeSessions.slice(0, 8),
      alerts: alerts.slice(0, 8)
    });
  } catch (error) {
    Logger.log("Erro em _getDashboard: " + error.message);
    throw error;
  }
}

function _getSettings(payload, session) {
  // Autorização delegada ao IamGuard — política 'getSettings' restringe a role admin.
  // A verificação manual if (session.role !== 'admin') foi substituída acima no
  // _dispatch, que agora chama IamGuard.guard antes de invocar este handler.
  return ResponseHandler.success({
    appTitle: Config.APP_TITLE,
    appVersion: Config.APP_VERSION,
    adminEmailConfigured: !!Config.ADMIN_EMAIL,
    spreadsheetConfigured: !!Config.getSpreadsheetId(),
    backupConfigured: !!Config.BACKUP_FOLDER_ID,
    neuroThresholds: NeuroConfig.THRESHOLDS,
    sessionDurationHours: Config.SESSION_DURATION_MS / (60 * 60 * 1000)
  });
}

function _getStudentOverview(payload, session) {
  var validation = ValidationService.requireStudent(payload);
  if (!ResponseHandler.isSuccess(validation)) return validation;

  var studentResponse = StudentController.getById(payload, session);
  if (!ResponseHandler.isSuccess(studentResponse)) return studentResponse;
  return ResponseHandler.success({
    student: ResponseHandler.dataOf(studentResponse),
    alerts: _dataOrEmpty(AlertController.getAlerts({
      studentId: payload.studentId,
      status: payload.alertStatus || Constants.ALERT_STATUS.PENDING
    }, session)),
    interventions: _dataOrEmpty(InterventionController.list({
      studentId: payload.studentId
    }, session)),
    sensors: _dataOrEmpty(SensorController.list({
      estudanteId: payload.studentId
    }, session))
  });
}

function _getApplicationData(payload, session) {
  try {
    var application = payload.application || '';
    var modules = AppController.getApplicationModules(application);
    if (!modules || modules.length === 0) {
      return ResponseHandler.error(Constants.ERROR_MESSAGES.APPLICATION_NOT_FOUND);
    }
    var results = modules.map(function(module) {
      var response = module.getIndicators(payload, session);
      var normalized = ResponseHandler.normalize(response);
      return {
        name: module.name,
        status: normalized.status,
        data: normalized.data,
        message: normalized.message
      };
    });
    return ResponseHandler.success({ application: application, modules: results });
  } catch (error) {
    Logger.log("Erro em _getApplicationData: " + error.message);
    throw error;
  }
}

function _jsonOutput(obj) {
  try {
    try {
      return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log("Erro em _jsonOutput: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _jsonOutput: " + error.message);
    throw error;
  }
}
