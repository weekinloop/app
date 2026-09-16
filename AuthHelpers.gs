/** Obtem ou cria aba SessoesAuth para sessoes de token. */
function getSessoesAuthSheet_() {
  try {
    var ss = getBoundSpreadsheet_();
    if (!ss) return null;
    var sheet = ss.getSheetByName('SessoesAuth');
    if (!sheet) {
      sheet = ss.insertSheet('SessoesAuth');
      sheet.getRange(1, 1, 1, 5).setValues([['token', 'userId', 'username', 'role', 'expiresAt']]);
    }
    return sheet;
  } catch (error) {
    Logger.log("Erro em getSessoesAuthSheet_: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Valida credenciais e devolve um token (armazenado em aba SessoesAuth).
 */
function AuthHelpers_loginWithToken(username, password) {
  try {
    try {
      if (!String(username || '').trim() || !String(password || '').trim()) {
        return { success: false, message: 'Username e password sao obrigatorios' };
      }

      var user = AuthHelpers_findPlaintextUser_(username);
      if (!user || user.password !== password) {
        return { success: false, message: 'Credenciais invalidas' };
      }

      var sheet = getSessoesAuthSheet_();
      if (!sheet) return { success: false, message: 'Erro ao criar sessao.' };

      var token = Utilities.getUuid().replace(/-/g, '');
      var expiresAt = new Date().getTime() + (6 * 60 * 60 * 1000);
      sheet.appendRow([token, String(user.email || user.username), String(user.username), String(user.role || 'USER'), expiresAt]);

      var baseUrl = '';
      try {
        baseUrl = ScriptApp.getService().getUrl();
      } catch (e) {}

      return {
        success: true,
        token: token,
        user: { username: user.username, role: user.role, name: user.name },
        redirectUrl: baseUrl ? baseUrl + '?page=app#tok=' + token : ''
      };
    } catch (e) {
      Logger.log('AuthHelpers_loginWithToken erro: ' + e.toString());
      return { success: false, message: 'Erro ao fazer login' };
    }
  } catch (error) {
    Logger.log("Erro em AuthHelpers_loginWithToken: " + error.message);
    throw error;
  }
}

/**
 * Valida um token (busca em aba SessoesAuth).
 */
function AuthHelpers_isAuthenticatedByToken(tok) {
  try {
    try {
      try {
        if (!tok) return false;
        var sheet = getSessoesAuthSheet_();
        if (!sheet) return false;

        var data = sheet.getDataRange().getValues();
        var now = new Date().getTime();
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(tok)) {
            var expiresAt = Number(data[i][4]);
            if (expiresAt <= now) {
              sheet.deleteRow(i + 1);
              return false;
            }
            return true;
          }
        }
        return false;
      } catch (e) {
        Logger.log('AuthHelpers_isAuthenticatedByToken erro: ' + e.toString());
        return false;
      }
    } catch (error) {
      Logger.log("Erro em AuthHelpers_isAuthenticatedByToken: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em AuthHelpers_isAuthenticatedByToken: " + error.message);
    throw error;
  }
}

/**
 * Retorna usuario associado ao token.
 */
function AuthHelpers_getSessionUser(tok) {
  try {
    try {
      try {
        if (!tok) return null;
        var sheet = getSessoesAuthSheet_();
        if (!sheet) return null;

        var data = sheet.getDataRange().getValues();
        var now = new Date().getTime();
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(tok)) {
            var expiresAt = Number(data[i][4]);
            if (expiresAt <= now) {
              sheet.deleteRow(i + 1);
              return null;
            }
            return {
              username: data[i][2],
              role: data[i][3],
              userId: data[i][1]
            };
          }
        }
        return null;
      } catch (e) {
        Logger.log('AuthHelpers_getSessionUser erro: ' + e.toString());
        return null;
      }
    } catch (error) {
      Logger.log("Erro em AuthHelpers_getSessionUser: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em AuthHelpers_getSessionUser: " + error.message);
    throw error;
  }
}

/**
 * Encerra sessao (remove token da aba).
 */
function AuthHelpers_logoutWithToken(tok) {
  try {
    try {
      try {
        if (!tok) return { ok: true };
        var sheet = getSessoesAuthSheet_();
        if (!sheet) return { ok: true };

        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(tok)) {
            sheet.deleteRow(i + 1);
            return { ok: true };
          }
        }
        return { ok: true };
      } catch (e) {
        Logger.log('AuthHelpers_logoutWithToken erro: ' + e.toString());
        return { ok: false, message: e.toString() };
      }
    } catch (error) {
      Logger.log("Erro em AuthHelpers_logoutWithToken: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em AuthHelpers_logoutWithToken: " + error.message);
    throw error;
  }
}

/**
 * Remove AUTH_TOK_* obsoletos de ScriptProperties.
 */
function cleanupOldAuthTokens_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var cleaned = 0;
    for (var key in all) {
      if (key.indexOf('AUTH_TOK_') === 0) {
        props.deleteProperty(key);
        cleaned++;
      }
    }
    return { cleaned: cleaned, message: 'Limpeza concluida: ' + cleaned + ' tokens removidos.' };
  } catch (error) {
    Logger.log("Erro em cleanupOldAuthTokens_: " + error.message);
    throw error;
  }
}

/**
 * 9.
/**
 * 9. Constrói uma URL absoluta com token anexado como ?page=app#tok=<token>.
 */
function AuthHelpers_buildAuthenticatedRedirectUrl_(tok) {
  try {
    var baseUrl = ScriptApp.getService().getUrl();
    return baseUrl ? baseUrl + '?page=app#tok=' + tok : '';
  } catch (e) {
    Logger.log('AuthHelpers_buildAuthenticatedRedirectUrl_ erro: ' + e.toString());
    return '';
  }
}

/**
 * 10. Resolve token de payload flexível: string, {_authToken}, ou {tok}.
 */
function AuthHelpers_resolveAuthTokenFromPayload_(payloadOrToken) {
  try {
    if (typeof payloadOrToken === 'string') {
      return payloadOrToken;
    }
    if (typeof payloadOrToken === 'object' && payloadOrToken !== null) {
      return payloadOrToken._authToken || payloadOrToken.tok || null;
    }
    return null;
  } catch (e) {
    Logger.log('AuthHelpers_resolveAuthTokenFromPayload_ erro: ' + e.toString());
    return null;
  }
}

/**
 * 11. Valida token e retorna principal; falha se inválido ou expirado.
 * Lança erro normalizado se autenticação falhar.
 */
function AuthHelpers_requireAuthenticatedPrincipal_(payloadOrToken) {
  try {
    var token = AuthHelpers_resolveAuthTokenFromPayload_(payloadOrToken);
    if (!token) {
      throw new Error('TOKEN_MISSING');
    }
    if (!AuthHelpers_isAuthenticatedByToken(token)) {
      throw new Error('TOKEN_INVALID');
    }
    var principal = AuthHelpers_getSessionUser(token);
    if (!principal) {
      throw new Error('SESSION_NOT_FOUND');
    }
    return principal;
  } catch (e) {
    var msg = String(e.message || e).toUpperCase();
    if (msg.indexOf('TOKEN') >= 0 || msg.indexOf('SESSION') >= 0) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    throw e;
  }
}
