/**
 * @file       TestAppServersMigration.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-21
 *
 * @summary
 *   Suite de testes para validar a migração dos 24 App Servers.
 *
 * @description
 *   Valida que todos os App Servers foram registrados corretamente no
 *   AppServerRegistry e que seus metadados estão completos e consistentes.
 */

/**
 * Teste principal: valida todos os App Servers migrados.
 */
function testAllAppServersMigration() {
  try {
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   VALIDAÇÃO DA MIGRAÇÃO DE APP SERVERS — NEUROEDU');
    Logger.log('═══════════════════════════════════════════════════════════\n');
  
    var results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  
    // 1. Validar integridade do registry
    Logger.log('📋 1. Validando integridade do AppServerRegistry...');
    var validation = AppServerRegistry.validateRegistry();
    results.total++;
  
    if (validation.valid) {
      Logger.log('✅ Registry válido: ' + validation.totalServers + ' servers registrados');
      results.passed++;
    } else {
      Logger.log('❌ Registry inválido:');
      validation.errors.forEach(function(err) {
        Logger.log('   - ' + err);
        results.errors.push(err);
      });
      results.failed++;
    }
  
    // 2. Verificar contagem esperada
    Logger.log('\n📊 2. Verificando contagem de servers...');
    var expectedCount = 24;
    var actualCount = validation.totalServers;
    results.total++;
  
    if (actualCount === expectedCount) {
      Logger.log('✅ Contagem correta: ' + actualCount + ' de ' + expectedCount);
      results.passed++;
    } else {
      var msg = 'Esperado ' + expectedCount + ' servers, encontrado ' + actualCount;
      Logger.log('❌ ' + msg);
      results.errors.push(msg);
      results.failed++;
    }
  
    // 3. Listar todos os servers
    Logger.log('\n📝 3. Listando todos os servers registrados...');
    var servers = AppServerRegistry.list();
    servers.forEach(function(server, index) {
      Logger.log('   ' + (index + 1) + '. ' + server.id + ' — ' + server.title + ' (v' + server.version + ')');
      Logger.log('      Sensores: ' + server.sensors.join(', '));
      Logger.log('      Endpoints: ' + server.endpoints.join(', '));
    });
  
    // 4. Testar cada server individualmente
    Logger.log('\n🔍 4. Testando cada server individualmente...');
    var expectedServers = [
      'reading-fluency',
      'math-anxiety',
      'adhd-regulation',
      'science-lab',
      'aac-nonverbal',
      'gamification-engagement',
      'physical-ed',
      'dyslexia-focus',
      'working-memory',
      'mindfulness',
      'aha-moments',
      'ergonomics',
      'expressive-reading',
      'study-patterns',
      'methodology-impact',
      'reaction-games',
      'distraction-micromoments',
      'creative-writing',
      'artistic-feedback',
      'learning-preferences',
      'stem-effort',
      'leadership-styles',
      'music-therapy',
      'post-error-resilience'
    ];
  
    expectedServers.forEach(function(serverId) {
      results.total++;
      var server = AppServerRegistry.get(serverId);
    
      if (!server) {
        var msg = 'Server não encontrado: ' + serverId;
        Logger.log('   ❌ ' + msg);
        results.errors.push(msg);
        results.failed++;
        return;
      }
    
      // Validar estrutura do server
      var issues = [];
      if (!server.meta) issues.push('falta meta');
      if (!server.meta.id) issues.push('falta meta.id');
      if (!server.meta.version) issues.push('falta meta.version');
      if (!server.meta.title) issues.push('falta meta.title');
      if (!server.meta.endpoints) issues.push('falta meta.endpoints');
      if (!server.saveRecord) issues.push('falta função saveRecord');
      if (!server.getRecords) issues.push('falta função getRecords');
      if (!server.getIndicators) issues.push('falta função getIndicators');
    
      if (issues.length > 0) {
        Logger.log('   ❌ ' + serverId + ': ' + issues.join(', '));
        results.errors.push(serverId + ': ' + issues.join(', '));
        results.failed++;
      } else {
        Logger.log('   ✅ ' + serverId);
        results.passed++;
      }
    });
  
    // 5. Testar configuração do IamGuard
    Logger.log('\n🔐 5. Testando configuração automática do IamGuard...');
    results.total++;
  
    try {
      AppServerRegistry.configureIamPolicies();
      Logger.log('✅ IamGuard configurado com sucesso');
      results.passed++;
    } catch (e) {
      Logger.log('❌ Erro ao configurar IamGuard: ' + e.message);
      results.errors.push('IamGuard: ' + e.message);
      results.failed++;
    }
  
    // 6. Testar geração de documentação
    Logger.log('\n📚 6. Testando geração de documentação...');
    results.total++;
  
    try {
      var docs = AppServerRegistry.generateApiDocs();
      if (docs && docs.openapi && docs.paths) {
        var pathCount = Object.keys(docs.paths).length;
        Logger.log('✅ Documentação gerada: ' + pathCount + ' endpoints documentados');
        results.passed++;
      } else {
        Logger.log('❌ Documentação inválida');
        results.errors.push('Documentação: estrutura inválida');
        results.failed++;
      }
    } catch (e) {
      Logger.log('❌ Erro ao gerar documentação: ' + e.message);
      results.errors.push('Documentação: ' + e.message);
      results.failed++;
    }
  
    // 7. Testar describe de um server
    Logger.log('\n🔎 7. Testando describe de um server...');
    results.total++;
  
    try {
      var described = AppServerRegistry.describe('reading-fluency');
      if (described && described.id && described.endpoints) {
        Logger.log('✅ Describe funcionando corretamente');
        Logger.log('   Exemplo: ' + described.title + ' com ' + 
          Object.keys(described.endpoints).length + ' endpoints');
        results.passed++;
      } else {
        Logger.log('❌ Describe retornou estrutura inválida');
        results.errors.push('Describe: estrutura inválida');
        results.failed++;
      }
    } catch (e) {
      Logger.log('❌ Erro ao descrever server: ' + e.message);
      results.errors.push('Describe: ' + e.message);
      results.failed++;
    }
  
    // Relatório final
    Logger.log('\n═══════════════════════════════════════════════════════════');
    Logger.log('   RELATÓRIO FINAL');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('Total de testes: ' + results.total);
    Logger.log('✅ Passou: ' + results.passed);
    Logger.log('❌ Falhou: ' + results.failed);
  
    if (results.failed > 0) {
      Logger.log('\n⚠️ ERROS ENCONTRADOS:');
      results.errors.forEach(function(err, index) {
        Logger.log('   ' + (index + 1) + '. ' + err);
      });
    }
  
    Logger.log('\n' + (results.failed === 0 ? '🎉 SUCESSO! Todos os testes passaram!' : 
      '⚠️ Alguns testes falharam. Revise os erros acima.'));
    Logger.log('═══════════════════════════════════════════════════════════\n');
  
    return results;
  } catch (error) {
    Logger.log("Erro em testAllAppServersMigration: " + error.message);
    throw error;
  }
}

/**
 * Teste de dispatch simulado (sem banco de dados real).
 */
function testAppServerDispatch() {
  try {
    Logger.log('\n🚀 Testando dispatch simulado...\n');
  
    var mockSession = {
      valid: true,
      userId: 'test-user',
      username: 'teste',
      role: 'professor'
    };
  
    var mockPayload = {
      sessionId: 'session-test-123',
      studentId: 'student-test-456',
      theta_alpha_ratio: 1.5,
      regression_count: 2,
      fixation_duration_ms: 250
    };
  
    Logger.log('📝 Payload de teste:');
    Logger.log(JSON.stringify(mockPayload, null, 2));
  
    Logger.log('\n🔄 Tentando dispatch para reading-fluency.saveRecord...');
  
    try {
      var result = AppServerRegistry.dispatch('reading-fluency', 'saveRecord', mockPayload, mockSession);
    
      if (result) {
        Logger.log('✅ Dispatch executado');
        Logger.log('   Status: ' + (result.success ? 'Sucesso' : 'Falha'));
        if (result.success && result.data) {
          Logger.log('   Data: ' + JSON.stringify(result.data));
        }
        if (!result.success && result.message) {
          Logger.log('   Mensagem: ' + result.message);
        }
      }
    } catch (e) {
      Logger.log('⚠️ Erro durante dispatch (esperado se banco não configurado):');
      Logger.log('   ' + e.message);
    }
  
    Logger.log('\n✅ Teste de dispatch concluído');
  } catch (error) {
    Logger.log("Erro em testAppServerDispatch: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório de cobertura da migração.
 */
function generateMigrationReport() {
  try {
    Logger.log('\n📊 RELATÓRIO DE COBERTURA DA MIGRAÇÃO\n');
  
    var servers = AppServerRegistry.list();
  
    Logger.log('Total de App Servers: ' + servers.length);
    Logger.log('\n┌─────┬──────────────────────────────┬─────────┬───────────┬───────────┐');
    Logger.log('│ ID  │ Título                       │ Versão  │ Sensores  │ Endpoints │');
    Logger.log('├─────┼──────────────────────────────┼─────────┼───────────┼───────────┤');
  
    servers.forEach(function(server) {
      var id = (server.id + '                              ').substring(0, 28);
      var title = (server.title + '                              ').substring(0, 28);
      var version = server.version;
      var sensorCount = server.sensors.length;
      var endpointCount = server.endpoints.length;
    
      Logger.log('│ ' + id + ' │ ' + title + ' │ ' + version + '   │ ' + 
        sensorCount + '         │ ' + endpointCount + '         │');
    });
  
    Logger.log('└─────┴──────────────────────────────┴─────────┴───────────┴───────────┘');
  
    // Estatísticas
    var totalSensors = 0;
    var totalEndpoints = 0;
    var sensorTypes = {};
  
    servers.forEach(function(server) {
      totalSensors += server.sensors.length;
      totalEndpoints += server.endpoints.length;
      server.sensors.forEach(function(sensor) {
        sensorTypes[sensor] = (sensorTypes[sensor] || 0) + 1;
      });
    });
  
    Logger.log('\n📈 Estatísticas:');
    Logger.log('   Média de sensores por App: ' + (totalSensors / servers.length).toFixed(1));
    Logger.log('   Média de endpoints por App: ' + (totalEndpoints / servers.length).toFixed(1));
  
    Logger.log('\n🔬 Distribuição de Sensores:');
    Object.keys(sensorTypes).sort().forEach(function(sensor) {
      var count = sensorTypes[sensor];
      var bar = '';
      for (var i = 0; i < count; i++) bar += '█';
      Logger.log('   ' + sensor + ': ' + bar + ' (' + count + ' Apps)');
    });
  
    Logger.log('\n✅ Relatório gerado com sucesso!\n');
  } catch (error) {
    Logger.log("Erro em generateMigrationReport: " + error.message);
    throw error;
  }
}

/**
 * Executa todos os testes em sequência.
 */
function runAllTests() {
  testAllAppServersMigration();
  testAppServerDispatch();
  generateMigrationReport();
  
  Logger.log('\n🏁 Todos os testes concluídos!\n');
}
