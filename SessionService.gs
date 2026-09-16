// SessionService.gs
/**
 * @deprecated Esta implementação de sessão legada foi NEUTRALIZADA.
 *
 * Motivo: Usar CacheService.getUserCache() é inseguro em ambientes "Execute as: Me"
 * pois o cache é compartilhado entre todos os usuários executores.
 *
 * Nova implementação: Veja AuthHelpers.gs para rotinas reutilizáveis baseadas em token
 * e ScriptProperties (Prompt 18 - Rotinas Reutilizaveis De Autenticacao).
 *
 * Migrando para ScriptProperties com prefixo AUTH_TOK_ e TTL em JSON.
 */

const CURRENT_SESSION_KEY_sgteLegacy = "SGTE_CURRENT_SESSION";
const SESSION_TTL_SECONDS_sgteLegacy = 21600;

function createSession_sgteLegacy(userId) {
  // DEPRECATED: Use AuthHelpers_loginWithToken() em vez disso.
  throw new Error('createSession_sgteLegacy foi neutralizada. Use AuthHelpers_loginWithToken().');
}

function getSession_sgteLegacy() {
  // DEPRECATED: Use AuthHelpers_getSessionUser() em vez disso.
  return null;
}

function invalidateSession_sgteLegacy() {
  // DEPRECATED: Use AuthHelpers_logoutWithToken() em vez disso.
  // Sem operação; retorna silenciosamente.
}

function getCurrentSessionUser_sgteLegacy() {
  // DEPRECATED: Use AuthHelpers_getSessionUser() em vez disso.
  return null;
}
