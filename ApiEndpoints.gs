/**
 * @file ApiEndpoints.gs
 * Endpoints públicos chamáveis via google.script.run no frontend.
 * Gerado por codex_integrate_frontend_backend.py — pode ser customizado.
 */

/**
 * Carrega dados iniciais do dashboard.
 * Aceita o token via parâmetro (frota usa loginWithToken → ?page=app#tok= na URL).
 * @param {string} [tok] Token da sessão.
 * @return {{success:boolean, currentUser?:Object, appData?:Object, message?:string}}
 */
function getInitialAppData(tok) {
  var session = typeof AuthStd_getSession_ === 'function'
    ? AuthStd_getSession_(tok)
    : { valid: false };
  if (!session || !session.valid) {
    return { success: false, message: 'Sessão inválida. Faça login novamente.' };
  }
  var currentUser = {
    id:       session.userId   || session.id       || session.username || 'unknown',
    username: session.username || session.name     || 'Usuário',
    name:     session.nome     || session.name     || session.username || 'Usuário',
    role:     session.role     || 'USER',
    email:    session.email    || ''
  };
  return { success: true, currentUser: currentUser, appData: {} };
}

/**
 * Valida se a sessão corrente ainda é válida (heartbeat do frontend).
 * @param {string} tok
 */
function pingSession(tok) {
  if (!tok) return { ok: false };
  try {
    return {
      ok: typeof AuthStd_isAuthenticatedByToken_ === 'function' &&
        AuthStd_isAuthenticatedByToken_(tok)
    };
  } catch (e) {
    return { ok: false };
  }
}

/**
 * Ponte de compatibilidade das 17 views App_*.html antigas.
 *
 * As telas enviam { action: 'getADHD', token: '...' }, enquanto o backend
 * moderno publica os modulos no AppServerRegistry. Mantemos uma allowlist
 * explicita e despachamos sempre para getRecords, reutilizando a validacao de
 * sessao e RBAC do registry. A action nunca e usada como nome de funcao.
 *
 * @param {Object} request
 * @return {{success:boolean,data?:*,message?:string,error?:*}}
 */
function getData(request) {
  try {
    request = request || {};
    var routes = {
      getAAC: 'aac-nonverbal',
      getADHD: 'adhd-regulation',
      getAhaMoments: 'aha-moments',
      getArts: 'artistic-feedback',
      getDyslexia: 'dyslexia-focus',
      getErgonomics: 'ergonomics',
      getGamification: 'gamification-engagement',
      getMath: 'math-anxiety',
      getMemory: 'working-memory',
      getMethodologies: 'methodology-impact',
      getMindfulness: 'mindfulness',
      getPhysicalEd: 'physical-ed',
      getPreferences: 'learning-preferences',
      getResilience: 'post-error-resilience',
      getScience: 'science-lab',
      getSTEM: 'stem-effort',
      getStudyPatterns: 'study-patterns'
    };

    var serverId = routes[String(request.action || '')];
    if (!serverId) {
      return ResponseHandler.error('Acao de leitura nao permitida.');
    }

    var session = _verifySession(String(request.token || '').trim());
    if (!session || !session.valid) {
      var invalid = ResponseHandler.error(Constants.ERROR_MESSAGES.SESSION_INVALID);
      invalid.code = 'SESSION_INVALID';
      return invalid;
    }
    session.role = String(session.role || '').toLowerCase().trim();

    return ResponseHandler.normalize(
      AppServerRegistry.dispatch(serverId, 'getRecords', request, session)
    );
  } catch (error) {
    return ResponseHandler.error(error, 'ApiEndpoints.getData');
  }
}
