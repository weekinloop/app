/**
 * @file       ApiGateway.gs
 * @project    WeekInLoop – Biometria nos anos iniciais
 * @summary    Gateway único (ex-ApiCallShim) que expõe `apiCall(service, method, payload)` para
 *             o wrapper `ApiClient.html` da frota, delegando ao fluxo nativo
 *             de autenticação canônico já presente em `AuthStandardService.gs` + `Code.gs`.
 *
 * Por que este arquivo existe
 * ───────────────────────────
 * O `ApiClient.html` (padrão da frota) chama:
 *   google.script.run.apiCall(service, method, payload)
 * O backend do WeekInLoop expõe `apiRequest(request)`, não `apiCall`.
 * Este shim faz a ponte sem alterar nenhum fluxo biométrico, de consentimento
 * ou de relatórios.
 *
 * Envelope de saída (esperado pelo ApiClient.html)
 * ─────────────────────────────────────────────────
 *   { ok: true,  data: <objeto> }           // sucesso
 *   { ok: false, error: { message: '...' } } // falha
 *
 * Rotas protegidas
 * ────────────────
 * Qualquer service/method diferente de AuthService.login exige que
 * `payload.token` seja uma sessão válida — a verificação é feita pela
 * função `apiRequest()` já existente em `Code.gs`.
 */

/**
 * Gateway público chamado pelo `ApiClient.html` via google.script.run.
 *
 * @param {string} service   Ex.: 'AuthService', 'reading-fluency', 'AppServerRegistry'
 * @param {string} method    Ex.: 'login', 'saveRecord', 'list'
 * @param {Object} payload   Ex.: { username: '...', password: '...' }
 *                           Para rotas protegidas, incluir { token: '...' }
 * @return {{ ok: boolean, data?: Object, error?: { message: string } }}
 */
function apiCall(service, method, payload) {
  try {
    try {
      payload = payload || {};

      // ── Rota de autenticação ──────────────────────────────────────────────
      if (service === 'AuthService' && method === 'login') {
        var authResult = _login(
          String(payload.username || '').trim(),
          String(payload.password || '')
        );
        // _login() devolve ResponseHandler.success/error:
        //   { success: true/false, data: {...}, message: '...' }
        if (authResult && authResult.success) {
          return { ok: true, data: authResult.data };
        }
        return { ok: false, error: { message: 'Usuário ou senha inválidos.' } };
      }

      if (service === 'AuthService' && method === 'logout') {
        var token = String(payload.token || payload.authToken || payload.tok || '').trim();
        if (token) _logout(token);
        return { ok: true, data: { success: true } };
      }

      var session = _verifySession(String(payload.token || '').trim());
      if (!session || !session.valid) {
        return { ok: false, error: { message: 'Sessão inválida ou expirada' } };
      }
      session.role = String(session.role || '').toLowerCase().trim();

      // ── Descoberta de Servers (API de Introspecção) ───────────────────────
      if (service === 'AppServerRegistry') {
        if (method === 'list') {
          return { ok: true, data: AppServerRegistry.list() };
        }
        if (method === 'describe') {
          var described = AppServerRegistry.describe(payload.serverId);
          if (described) {
            return { ok: true, data: described };
          }
          return { ok: false, error: { message: 'Server não encontrado: ' + payload.serverId } };
        }
        if (method === 'generateApiDocs') {
          weekInLoopRequireRoles_(session, ['admin']);
          return { ok: true, data: AppServerRegistry.generateApiDocs() };
        }
        if (method === 'validateRegistry') {
          weekInLoopRequireRoles_(session, ['admin']);
          return { ok: true, data: AppServerRegistry.validateRegistry() };
        }
      }

      // ── Controladores canônicos ──────────────────────────────────────────
      var controllerActions = {
        'SessionController.list': 'getSessions',
        'SessionController.start': 'startSession',
        'SessionController.end': 'endSession'
      };
      var controllerAction = controllerActions[String(service) + '.' + String(method)];
      if (controllerAction) {
        return weekInLoopGatewayEnvelope_(apiRequest(Object.assign({}, payload, { action: controllerAction })));
      }

      // ── Dispatch para App Servers ─────────────────────────────────────────
      // Formato: service = "reading-fluency", method = "saveRecord"
      var server = AppServerRegistry.get(service);
      if (server) {
        var result = AppServerRegistry.dispatch(service, method, payload, session);
        return weekInLoopGatewayEnvelope_(result);
      }

      // ── Demais rotas legadas (retrocompatibilidade) ───────────────────────
      // Constrói a requisição no formato esperado por apiRequest():
      //   { action, token, ...demais campos }
      var request = Object.assign({}, payload, { action: method });
      var result  = apiRequest(request);

      // apiRequest() devolve ResponseHandler: { success, data, message, error }
      return weekInLoopGatewayEnvelope_(result);

    } catch (e) {
      LoggerService.error('ApiGateway.apiCall', e);
      return { ok: false, error: { message: e.message || 'Erro interno no servidor.' } };
    }
  } catch (error) {
    Logger.log("Erro em apiCall: " + error.message);
    throw error;
  }
}

function weekInLoopRequireRoles_(session, roles) {
  if (!session || roles.indexOf(String(session.role || '').toLowerCase()) === -1) {
    throw new Error('Permissão insuficiente para esta operação.');
  }
}

function weekInLoopGatewayEnvelope_(result) {
  if (result && result.success) return { ok: true, data: result.data };
  var message = result && (result.message || result.error);
  if (message && typeof message === 'object') message = message.message || message.code;
  return {
    ok: false,
    error: { message: String(message || 'Operação não concluída.') }
  };
}
