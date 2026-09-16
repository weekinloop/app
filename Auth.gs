/**
 * @file       Auth.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Módulo de autenticação. Gerencia login, logout, criação e validação
 *   de tokens de sessão simples armazenados na planilha Google Sheets.
 *
 * @description
 *   Conforme requisito do projeto, as credenciais (usuário e senha) são
 *   armazenadas em texto plano na aba "Usuarios" da planilha principal.
 *   Após autenticação bem-sucedida, um token UUID é gerado e salvo na
 *   aba "SessoesAuth" com timestamp de expiração. Cada requisição
 *   subsequente valida o token antes de processar a ação.
 *
 * @integrations
 *   Code.gs          : Mantido para compatibilidade; o fluxo ativo usa
 *                      AuthStandardService via AuthStandardWiring.gs
 *   Config.gs        : Consome SHEET_NAMES.USERS, SHEET_NAMES.SESSIONS_AUTH,
 *                      SESSION_DURATION_MS e SPREADSHEETS_ID
 *   Database.gs      : Usa Database.getSheet() para acesso às abas
 *   Utils.gs         : Usa Utils.generateUUID() para criar tokens
 *   Login.html       : Envia credenciais via google.script.run
 *
 * @sheetColumns (aba Usuarios)
 *   A | B       | C    | D     | E
 *   ID| Username| Senha| Papel | Ativo
 *
 * @sheetColumns (aba SessoesAuth)
 *   A     | B      | C         | D
 *   Token | UserID | Criado_em | Expira_em
 *
 * @roles
 *   admin      : Acesso total (CRUD de usuários, configurações)
 *   professor  : Acesso a turmas próprias, dados biométricos, relatórios
 *   coordenador: Acesso a relatórios consolidados e configurações de alertas
 */

var Auth = (function() {

  function _withAuthWriteLock(operationName, callback) {
    try {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(10000)) {
        throw new Error('Nao foi possivel obter lock para ' + operationName + '.');
      }
      try {
        return callback();
      } finally {
        lock.releaseLock();
      }
    } catch (error) {
      Logger.log("Erro em _withAuthWriteLock: " + error.message);
      throw error;
    }
  }

  /**
   * Autentica um usuário com base em username e senha em texto plano.
   * Cria um token de sessão e o armazena na aba SessoesAuth.
   *
   * @param  {string} username
   * @param  {string} password
   * @return {Object} {success, data: {token, userId, role, username}, error}
   */
  function login(username, password) {
    try {
      try {
        var sheet = Database.getSheet(Config.SHEET_NAMES.USERS);
        var data  = sheet.getDataRange().getValues();

        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          // Colunas: [0]ID [1]Username [2]Senha [3]Papel [4]Ativo
          if (row[1] === username && row[2] === password && row[4] === true) {
            var token   = Utils.generateUUID();
            var userId  = row[0];
            var role    = row[3];
            var now     = new Date();
            var expires = new Date(now.getTime() + Config.SESSION_DURATION_MS);

            _withAuthWriteLock('Auth.login', function() {
              var sessSheet = Database.getSheet(Config.SHEET_NAMES.SESSIONS_AUTH);
              sessSheet.appendRow([token, userId, now.toISOString(), expires.toISOString()]);
            });

            return ResponseHandler.success({ token: token, userId: userId, role: role, username: username });
          }
        }
        return ResponseHandler.error('Usuário ou senha incorretos.');
      } catch (err) {
        return ResponseHandler.error(err, 'Auth.login');
      }
    } catch (error) {
      Logger.log("Erro em login: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica se um token de sessão é válido e não expirou.
   *
   * @param  {string} token
   * @return {Object} {valid: boolean, userId, role}
   */
  function verifySession(token) {
    try {
      try {
        if (!token) return { valid: false };
        try {
          var sheet = Database.getSheet(Config.SHEET_NAMES.SESSIONS_AUTH);
          var data  = sheet.getDataRange().getValues();
          var now   = new Date();

          for (var i = 1; i < data.length; i++) {
            var row = data[i];
            // Colunas: [0]Token [1]UserID [2]Criado_em [3]Expira_em
            if (row[0] === token) {
              var expires = new Date(row[3]);
              if (now < expires) {
                var user = _findActiveUser(row[1]);
                if (!user) return { valid: false };
                return {
                  valid: true,
                  userId: user.userId,
                  role: user.role,
                  username: user.username
                };
              } else {
                return { valid: false };
              }
            }
          }
          return { valid: false };
        } catch (err) {
          LoggerService.error('Auth.verifySession', err);
          return { valid: false };
        }
      } catch (error) {
        Logger.log("Erro em verifySession: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em verifySession: " + error.message);
      throw error;
    }
  }

  function _findActiveUser(userId) {
    try {
      try {
        var sheet = Database.getSheet(Config.SHEET_NAMES.USERS);
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === userId && data[i][4] === true) {
            return { userId: data[i][0], username: data[i][1], role: data[i][3] };
          }
        }
        return null;
      } catch (error) {
        Logger.log("Erro em _findActiveUser: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _findActiveUser: " + error.message);
      throw error;
    }
  }

  /**
   * Invalida um token de sessão (logout).
   * Remove a linha correspondente da aba SessoesAuth.
   *
   * @param  {string} token
   * @return {Object} {success, error}
   */
  function logout(token) {
    try {
      var sheet = Database.getSheet(Config.SHEET_NAMES.SESSIONS_AUTH);
      var data  = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === token) {
          _withAuthWriteLock('Auth.logout', function() {
            sheet.deleteRow(i + 1);
          });
          return ResponseHandler.success(null);
        }
      }
      return ResponseHandler.error(Constants.ERROR_MESSAGES.TOKEN_NOT_FOUND);
    } catch (err) {
      return ResponseHandler.error(err, 'Auth.logout');
    }
  }

  /**
   * Cria um novo usuário na aba Usuarios.
   * Apenas administradores podem chamar esta função.
   *
   * @param  {Object} payload  {newUsername, newPassword, role}
   * @param  {Object} session  Sessão validada com role=admin
   * @return {Object} {success, data, error}
   */
  function createUser(payload, session) {
    try {
      if (session.role !== 'admin') {
        return ResponseHandler.error(Constants.ERROR_MESSAGES.PERMISSION_DENIED);
      }
      try {
        var sheet  = Database.getSheet(Config.SHEET_NAMES.USERS);
        var userId = Utils.generateUUID();
        _withAuthWriteLock('Auth.createUser', function() {
          sheet.appendRow([
            userId,
            payload.newUsername,
            payload.newPassword,
            payload.role || 'professor',
            true
          ]);
        });
        return ResponseHandler.success({ userId: userId });
      } catch (err) {
        return ResponseHandler.error(err, 'Auth.createUser');
      }
    } catch (error) {
      Logger.log("Erro em createUser: " + error.message);
      throw error;
    }
  }

  return { login: login, verifySession: verifySession, logout: logout, createUser: createUser };

})();

// Legacy alias kept for gradual migration of older calls.
var Auth_ = Auth;
