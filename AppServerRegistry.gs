/**
 * @file       AppServerRegistry.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Registry central de todos os App*Server para descoberta automática,
 *   dispatch unificado e configuração declarativa de autorização.
 *
 * @description
 *   Este registry elimina a necessidade de configuração manual de rotas
 *   e políticas de acesso. Cada App*Server se auto-registra ao carregar,
 *   declarando seus metadados (id, endpoints, autorização, sensores, etc.).
 *   O registry então expõe APIs de descoberta e dispatch inteligente.
 *
 * @integrations
 *   App*Server.gs (todos), ApiGateway.gs, IamGuard.gs, Code.gs
 *
 * @benefits
 *   - Descoberta automática de aplicações disponíveis
 *   - Autorização declarativa (não precisa editar Code.gs)
 *   - Documentação automática (OpenAPI-like)
 *   - Versionamento por aplicação
 *   - Validação de contratos em tempo de execução
 */

var AppServerRegistry = (function() {
  'use strict';
  
  var _servers = {};
  var _configured = false;

  // Bootstrap lazy: o registro no load e' pulado quando o App*Server carrega antes
  // deste arquivo (ordem de load do GAS). Resolve-se sob demanda, espelhando
  // AppController.ensureLegacyRegistrations_.
  var _ensured = false;
  function ensureRegistrations_() {
    if (_ensured) { return; }
    var candidates = [
      typeof App01_ReadingFluencyServer !== 'undefined' ? App01_ReadingFluencyServer : null,
      typeof App02_MathAnxietyServer !== 'undefined' ? App02_MathAnxietyServer : null,
      typeof App03_ADHDRegulationServer !== 'undefined' ? App03_ADHDRegulationServer : null,
      typeof App04_ScienceLabServer !== 'undefined' ? App04_ScienceLabServer : null,
      typeof App05_AACNonVerbalServer !== 'undefined' ? App05_AACNonVerbalServer : null,
      typeof App06_GamificationEngagementServer !== 'undefined' ? App06_GamificationEngagementServer : null,
      typeof App07_PhysicalEdServer !== 'undefined' ? App07_PhysicalEdServer : null,
      typeof App08_DyslexiaFocusServer !== 'undefined' ? App08_DyslexiaFocusServer : null,
      typeof App09_WorkingMemoryServer !== 'undefined' ? App09_WorkingMemoryServer : null,
      typeof App10_MindfulnessServer !== 'undefined' ? App10_MindfulnessServer : null,
      typeof App11_AhaMomentsServer !== 'undefined' ? App11_AhaMomentsServer : null,
      typeof App12_ErgonomicsServer !== 'undefined' ? App12_ErgonomicsServer : null,
      typeof App13_ExpressiveReadingServer !== 'undefined' ? App13_ExpressiveReadingServer : null,
      typeof App14_StudyPatternsServer !== 'undefined' ? App14_StudyPatternsServer : null,
      typeof App15_MethodologyImpactServer !== 'undefined' ? App15_MethodologyImpactServer : null,
      typeof App16_ReactionGamesServer !== 'undefined' ? App16_ReactionGamesServer : null,
      typeof App17_DistractionMicroMomentsServer !== 'undefined' ? App17_DistractionMicroMomentsServer : null,
      typeof App18_CreativeWritingServer !== 'undefined' ? App18_CreativeWritingServer : null,
      typeof App19_ArtisticFeedbackServer !== 'undefined' ? App19_ArtisticFeedbackServer : null,
      typeof App20_LearningPreferencesServer !== 'undefined' ? App20_LearningPreferencesServer : null,
      typeof App21_STEMEffortServer !== 'undefined' ? App21_STEMEffortServer : null,
      typeof App22_LeadershipStylesServer !== 'undefined' ? App22_LeadershipStylesServer : null,
      typeof App23_MusicTherapyServer !== 'undefined' ? App23_MusicTherapyServer : null,
      typeof App24_PostErrorResilienceServer !== 'undefined' ? App24_PostErrorResilienceServer : null
    ];
    for (var i = 0; i < candidates.length; i++) {
      var s = candidates[i];
      if (s && s.meta && s.meta.id && !_servers[s.meta.id]) { register(s); }
    }
    _ensured = true;
  }

  /**
   * Registra um novo App Server no registry.
   * Chamado automaticamente ao final de cada App*Server.gs.
   *
   * @param  {Object} server  Objeto com {meta, ...handlers}
   * @return {Object} O próprio server (fluent)
   */
  function register(server) {
    if (!server || !server.meta || !server.meta.id) {
      throw new Error('AppServerRegistry.register: server inválido, falta meta.id');
    }
    
    var id = server.meta.id;
    if (_servers[id]) {
      LoggerService.warn('AppServerRegistry', 'Server já registrado, sobrescrevendo: ' + id);
    }
    
    _servers[id] = server;
    _configured = false; // força reconfiguração do IamGuard
    
    LoggerService.info('AppServerRegistry', 'Registrado: ' + id + ' (v' + server.meta.version + ')');
    return server;
  }

  /**
   * Busca um server pelo seu ID.
   *
   * @param  {string} serverId  Ex: 'reading-fluency'
   * @return {Object|null}
   */
  function get(serverId) {
    ensureRegistrations_();
    return _servers[serverId] || null;
  }

  /**
   * Lista todos os servers registrados (metadados públicos).
   *
   * @return {Array<Object>} [{id, title, version, sensors, authorization, endpoints}, ...]
   */
  function list() {
    try {
      ensureRegistrations_();
      return Object.keys(_servers).map(function(id) {
        var server = _servers[id];
        var meta = server.meta;
        return {
          id: meta.id,
          title: meta.title,
          version: meta.version,
          description: meta.description,
          sensors: meta.sensors || [],
          authorization: meta.authorization || {},
          endpoints: Object.keys(meta.endpoints || {}),
          deprecated: meta.deprecated || false
        };
      });
    } catch (error) {
      Logger.log("Erro em list: " + error.message);
      throw error;
    }
  }

  /**
   * Detalha um server específico (incluindo metadados de cada endpoint).
   *
   * @param  {string} serverId
   * @return {Object|null}
   */
  function describe(serverId) {
    ensureRegistrations_();
    var server = get(serverId);
    if (!server) return null;
    
    var meta = server.meta;
    return {
      id: meta.id,
      title: meta.title,
      version: meta.version,
      description: meta.description,
      sensors: meta.sensors || [],
      sheetName: meta.sheetName,
      authorization: meta.authorization || {},
      endpoints: meta.endpoints || {},
      deprecated: meta.deprecated || false,
      migrateToVersion: meta.migrateToVersion || null
    };
  }

  /**
   * Dispatch inteligente: valida sessão, autorização e delega ao server.
   *
   * @param  {string} serverId   Ex: 'reading-fluency'
   * @param  {string} endpoint   Ex: 'saveRecord'
   * @param  {Object} payload    Dados da requisição
   * @param  {Object} session    Sessão validada pelo AuthStandardService
   * @return {Object} ResponseHandler.success/error
   */
  function dispatch(serverId, endpoint, payload, session) {
    ensureRegistrations_();
    var server = get(serverId);
    if (!server) {
      return ResponseHandler.error('Server não encontrado: ' + serverId);
    }
    
    var meta = server.meta;
    var endpointMeta = meta.endpoints[endpoint];
    
    if (!endpointMeta) {
      return ResponseHandler.error('Endpoint não encontrado: ' + serverId + '.' + endpoint);
    }
    
    // ── Validação de sessão ───────────────────────────────────────────────
    if (endpointMeta.requiresSession && !session.valid) {
      return ResponseHandler.error(Constants.ERROR_MESSAGES.SESSION_INVALID);
    }
    
    // ── Validação de sessão ativa e vínculo com o profissional ───────────
    if (endpointMeta.requiresActiveSession) {
      var validation = ValidationService.requireFields(payload, ['sessionId']);
      if (!ResponseHandler.isSuccess(validation)) {
        return ResponseHandler.error('Campo obrigatório: sessionId');
      }
      
      var activeSession = SessionController.requireOwnedActiveSession({
        sessionId: payload.sessionId
      }, session);
      if (!ResponseHandler.isSuccess(activeSession)) {
        return activeSession;
      }
    }

    // Todos os saveRecord dos apps gravam dados biométricos. Reaplica aqui a
    // finalidade de coleta para que nenhum server contorne o ConsentService.
    if (endpoint === 'saveRecord' && typeof ConsentService !== 'undefined') {
      var subjectId = payload && (payload.studentId ||
        (payload.metadata && payload.metadata.studentId));
      if (subjectId) {
        try {
          ConsentService.check(String(subjectId), 'collect');
        } catch (consentError) {
          if (consentError && consentError.isConsentError) {
            return ResponseHandler.error(
              'Consentimento ausente ou inválido para coleta: ' + consentError.status,
              'CONSENT_REQUIRED'
            );
          }
          throw consentError;
        }
      }
    }

    // ── Validação de autorização (delegação ao IamGuard) ──────────────────
    var routeName = serverId + '.' + endpoint;
    if (!_configured) {
      configureIamPolicies();
    }
    
    var authCheck = IamGuard.guard(routeName, session, function(principal) {
      // Autorização OK, delega ao handler
      if (typeof server[endpoint] !== 'function') {
        return ResponseHandler.error('Endpoint não implementado: ' + serverId + '.' + endpoint);
      }
      
      try {
        return server[endpoint](payload, session);
      } catch (err) {
        LoggerService.error('AppServerRegistry.dispatch', err);
        return ResponseHandler.error('Erro ao executar endpoint: ' + err.message);
      }
    });
    
    return authCheck;
  }

  /**
   * Configura IamGuard automaticamente baseado nos metadados de cada server.
   * Chamado automaticamente no primeiro dispatch após novos registros.
   */
  function configureIamPolicies() {
    try {
      ensureRegistrations_();
      var policies = {};
    
      Object.keys(_servers).forEach(function(serverId) {
        var server = _servers[serverId];
        var meta = server.meta;
        var baseAuth = meta.authorization || {};
      
        Object.keys(meta.endpoints || {}).forEach(function(endpoint) {
          var endpointMeta = meta.endpoints[endpoint];
          var routeName = serverId + '.' + endpoint;
        
          // Política específica do endpoint (se existir) sobrescreve a base
          var policy = endpointMeta.authorization || baseAuth;
          policies[routeName] = policy;
        });
      });
    
      IamGuard.configure({ policies: policies });
      _configured = true;
    
      LoggerService.info('AppServerRegistry', 'IamGuard configurado com ' + 
        Object.keys(policies).length + ' políticas');
    } catch (error) {
      Logger.log("Erro em configureIamPolicies: " + error.message);
      throw error;
    }
  }

  /**
   * Gera documentação estilo OpenAPI de todos os servers registrados.
   *
   * @return {Object} Estrutura documentação
   */
  function generateApiDocs() {
    try {
      ensureRegistrations_();
      var docs = {
        openapi: '3.0.0',
        info: {
          title: 'NeuroEdu App Servers API',
          version: Config.APP_VERSION || '1.0.0',
          description: 'API de aplicações de neuro-educação personalizada'
        },
        servers: [],
        paths: {}
      };
    
      Object.keys(_servers).forEach(function(serverId) {
        var server = _servers[serverId];
        var meta = server.meta;
      
        docs.servers.push({
          id: meta.id,
          title: meta.title,
          version: meta.version,
          description: meta.description
        });
      
        Object.keys(meta.endpoints || {}).forEach(function(endpoint) {
          var endpointMeta = meta.endpoints[endpoint];
          var path = '/' + serverId + '/' + endpoint;
        
          docs.paths[path] = {
            [String(endpointMeta.method || 'POST').toLowerCase()]: {
              summary: endpointMeta.description || endpoint,
              operationId: serverId + '.' + endpoint,
              security: endpointMeta.requiresSession ? [{ bearerAuth: [] }] : [],
              tags: [meta.title],
              responses: {
                '200': { description: 'Sucesso' },
                '401': { description: 'Não autorizado' },
                '403': { description: 'Acesso negado' },
                '500': { description: 'Erro interno' }
              }
            }
          };
        });
      });
    
      return docs;
    } catch (error) {
      Logger.log("Erro em generateApiDocs: " + error.message);
      throw error;
    }
  }

  /**
   * Valida a integridade de todos os servers registrados.
   * Útil para testes e diagnóstico.
   *
   * @return {Object} {valid: boolean, errors: Array<string>}
   */
  function validateRegistry() {
    try {
      ensureRegistrations_();
      var errors = [];
    
      Object.keys(_servers).forEach(function(serverId) {
        var server = _servers[serverId];
        var meta = server.meta;
      
        // Valida presença de campos obrigatórios
        if (!meta.id) errors.push(serverId + ': falta meta.id');
        if (!meta.version) errors.push(serverId + ': falta meta.version');
        if (!meta.title) errors.push(serverId + ': falta meta.title');
        if (!meta.endpoints) errors.push(serverId + ': falta meta.endpoints');
      
        // Valida que todos os endpoints declarados estão implementados
        Object.keys(meta.endpoints || {}).forEach(function(endpoint) {
          if (typeof server[endpoint] !== 'function') {
            errors.push(serverId + '.' + endpoint + ': declarado mas não implementado');
          }
        });
      });
    
      return {
        valid: errors.length === 0,
        totalServers: Object.keys(_servers).length,
        errors: errors
      };
    } catch (error) {
      Logger.log("Erro em validateRegistry: " + error.message);
      throw error;
    }
  }

  /**
   * Reseta o registry (útil para testes).
   */
  function reset() {
    _servers = {};
    _configured = false;
    LoggerService.info('AppServerRegistry', 'Registry resetado');
  }

  return {
    register: register,
    get: get,
    list: list,
    describe: describe,
    dispatch: dispatch,
    configureIamPolicies: configureIamPolicies,
    generateApiDocs: generateApiDocs,
    validateRegistry: validateRegistry,
    reset: reset
  };
})();

