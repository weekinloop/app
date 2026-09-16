/**
 * codex-frontend-backend-healthcheck
 * Sonda de saude leve: confirma que o frontend alcanca o backend via
 * google.script.run e recebe um envelope StandardReturn valido.
 *
 * - Sem efeitos colaterais, sem dependencia de sessao ou planilha.
 * - Arquivo isolado de proposito: nao altera nenhuma rota existente.
 * - Espelha o contrato StandardReturn ({ success, data, error, meta }),
 *   entao o ClientCall do frontend desempacota .data automaticamente.
 */
function ping() {
  try {
    return StandardReturn.ok({
      status: 'ok',
      service: 'backend',
      time: new Date().toISOString()
    });
  } catch (error) {
    Logger.log("Erro em ping: " + error.message);
    throw error;
  }
}
