/**
 * AuthStandardWiring.gs — Conexao do AuthStandardService (rollout FROTA-17).
 *
 * Replica o piloto "Way To Go As Is" (AUTH_PILOT_PLAN.md). Configura o servico
 * padronizado de autenticacao por token contra a aba 'Usuarios' real e expoe
 * wrappers de sessao por token. Os wrappers sao usados pelo gateway ativo e
 * mantem o fluxo de sessao concentrado no servico canonico.
 *
 * Os wrappers usam nomes prefixados `AuthStd_*` para NAO colidirem com a cadeia
 * de descoberta do gateway consolidado (ApiGateway.gs / gw_login_). O dispatch
 * de login e o gate de sessoes usam `AuthStd_loginWithToken_` e
 * `AuthStd_getSession_`; ambos delegam ao mesmo armazenamento por token.
 *
 * Credencial em TEXTO PLANO (decisao de frota) — zero hash. Aceita coluna
 * 'PasswordHash' opcional (apenas SHA-256 hex valido) sem exigi-la.
 */

/** Resolve a planilha principal reutilizando os helpers nativos do projeto. */
function AuthStd_getSpreadsheet_() {
  try { if (typeof _getSpreadsheet === 'function')          { var a = _getSpreadsheet();          if (a) return a; } } catch (e1) {}
  try { if (typeof getBoundSpreadsheet_ === 'function')     { var b = getBoundSpreadsheet_();     if (b) return b; } } catch (e2) {}
  try { if (typeof Auth_getSpreadsheet_ === 'function')     { var c = Auth_getSpreadsheet_();     if (c) return c; } } catch (e3) {}
  try { if (typeof SheetsDB_getSpreadsheet === 'function')  { var d = SheetsDB_getSpreadsheet();  if (d) return d; } } catch (e4) {}
  try { if (typeof authResolveSpreadsheet_ === 'function')  { var e = authResolveSpreadsheet_();  if (e) return e; } } catch (e5) {}
  try { var f = SpreadsheetApp.getActiveSpreadsheet(); if (f) return f; } catch (e6) {}
  return SpreadsheetApp.getActive();
}

/** Aceita apenas hashes SHA-256 hex (64 chars); caso contrario, vazio. */
function AuthStd_normalizarHash_(valor) {
  var v = String(valor == null ? '' : valor).trim();
  return /^[0-9a-fA-F]{64}$/.test(v) ? v : '';
}

/** Considera inativo somente um valor que o cadastro marque explicitamente. */
function AuthStd_isActive_(value) {
  if (value === false) return false;
  var v = String(value == null ? '' : value).trim().toLowerCase();
  return v !== 'inativo' && v !== 'inactive' && v !== 'false' &&
    v !== 'nao' && v !== 'não' && v !== '0';
}

/**
 * Adaptador findUser: localiza um usuario na aba 'Usuarios' por username OU email
 * (case-insensitive) e o devolve no formato esperado pelo AuthStandardService
 * ({ id, username, role, active, password, passwordHash }).
 */
function AuthStd_findUser_(username) {
  try {
    var ss = AuthStd_getSpreadsheet_();
    var sheet = ss.getSheetByName('Usuarios') ||
                ss.getSheetByName('Users') ||
                ss.getSheetByName('Usuários');
    if (!sheet || sheet.getLastRow() < 2) return null;
    var values = sheet.getDataRange().getValues();
    var h = values[0].map(function (x) { return String(x || '').trim().toLowerCase(); });
    // Indice por nome aceitando aliases EN/PT. A aba 'Usuarios' do WeekInLoop usa
    // cabecalhos em portugues (ID|Username|Senha|Papel|Ativo, via
    // CODEX_SCHEMA_HEADER_OVERRIDES), entao casar so nomes em ingles devolveria
    // iPass<0 e o login falharia silenciosamente.
    function col_(aliases) {
      try {
        for (var i = 0; i < aliases.length; i++) {
          var idx = h.indexOf(aliases[i]);
          if (idx >= 0) return idx;
        }
        return -1;
      } catch (error) {
        Logger.log("Erro em col_: " + error.message);
        throw error;
      }
    }
    var iUser   = col_(['username', 'usuario', 'usuário', 'login']);
    var iPass   = col_(['password', 'senha']);
    var iHash   = col_(['passwordhash', 'senha_hash']);
    var iRole   = col_(['role', 'papel', 'perfil']);
    var iNome   = col_(['nome', 'name']);
    var iEmail  = col_(['email', 'e-mail']);
    var iId     = col_(['id']);
    var iStatus = col_(['status', 'ativo', 'active']);
    if (iUser < 0 || (iPass < 0 && iHash < 0)) return null;

    var u = String(username || '').trim().toLowerCase();
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var rowUser = String(row[iUser] || '').trim().toLowerCase();
      var rowEmail = iEmail >= 0 ? String(row[iEmail] || '').trim().toLowerCase() : '';
      if (rowUser !== u && rowEmail !== u) continue;
      return {
        id:           iId >= 0 && row[iId] ? row[iId] : rowUser,
        username:     row[iUser],
        name:         iNome >= 0 ? row[iNome] : row[iUser],
        email:        iEmail >= 0 ? row[iEmail] : '',
        role:         iRole >= 0 && row[iRole] ? row[iRole] : 'professor',
        active:       iStatus < 0 || AuthStd_isActive_(row[iStatus]),
        password:     iPass >= 0 ? String(row[iPass] || '') : '',
        passwordHash: AuthStd_normalizarHash_(iHash >= 0 ? row[iHash] : '')
      };
    }
    return null;
  } catch (error) {
    Logger.log("Erro em AuthStd_findUser_: " + error.message);
    throw error;
  }
}

/** Instancia o AuthStandardService configurado para este projeto. */
function AuthStd_service_() {
  return AuthStandardService.configure({
    sessionKey: 'WEEKINLOOP_BIOMETRIA_NOS_ANOS_INICIAIS_AUTH_SESSION',
    sessionTtlSeconds: 21600,
    adapters: { findUser: AuthStd_findUser_ }
  });
}

/**
 * Valida credenciais via AuthStandardService e emite um token de sessao.
 * O servico gerencia o token internamente.
 * @return {{ success:boolean, token?:string, user?:Object, message?:string }}
 */
function AuthStd_loginWithToken_(username, password) {
  try {
    if (!String(username || '').trim() || !String(password || '')) {
      return { success: false, message: 'Informe usuario e senha.' };
    }
    var result = AuthStd_service_().login(String(username).trim(), String(password));
    if (!result || !result.ok) return { success: false, message: 'Credenciais invalidas.' };
    return { success: true, token: result.token, user: result.user };
  } catch (error) {
    Logger.log("Erro em AuthStd_loginWithToken_: " + error.message);
    throw error;
  }
}

/** Indica se um token de sessao e valido e nao expirou. */
function AuthStd_isAuthenticatedByToken_(tok) {
  return AuthStd_service_().isAuthenticatedByToken(tok);
}

/** Prefixo das chaves de token em ScriptProperties (espelha AuthStandardService). */
var AUTHSTD_TOKEN_PREFIX_ = 'WEEKINLOOP_BIOMETRIA_NOS_ANOS_INICIAIS_AUTH_SESSION_TOK_';

/**
 * Resolve a sessao completa a partir do token pelo mesmo serviço que emite o
 * token, evitando duas regras diferentes de expiração.
 * @return {{ valid:boolean, userId?:string, role?:string, username?:string }}
 */
function AuthStd_getSession_(tok) {
  try {
    if (typeof tok !== 'string' || tok.length === 0 || tok.length > 200) {
      return { valid: false };
    }
    var s = AuthStd_service_().getSessionByToken(tok);
    if (!s) return { valid: false };
    return { valid: true, userId: s.userId, role: s.role, username: s.username };
  } catch (error) {
    Logger.log("Erro em AuthStd_getSession_: " + error.message);
    throw error;
  }
}

/** Revoga (logout) um token de sessao. */
function AuthStd_logoutWithToken_(tok) {
  return AuthStd_service_().logout(tok);
}
