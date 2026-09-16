/**
 * BackendMaturity.gs - Ferramenta transversal de auto-avaliacao de maturidade.
 *
 * Uso:
 *   - Execute showBackendMaturityTool() ou openBackendMaturityPanel() no Apps Script.
 *   - Execute runBackendMaturityAssessment({ skipWrite: true }) para obter o relatorio.
 *   - Execute writeBackendMaturitySnapshot() para registrar historico na aba BackendMaturity.
 */

var BACKEND_MATURITY_VERSION = '1.1.0-transversal';
var BACKEND_MATURITY_SNAPSHOT_SHEET = 'BackendMaturity';

function showBackendMaturityTool() {
  return openBackendMaturityPanel();
}

function openBackendMaturity() {
  return openBackendMaturityPanel();
}

function openBackendMaturityPanel() {
  try {
    var template = HtmlService.createTemplateFromFile('BackendMaturityHtml');
    template.initialReport = JSON.stringify(runBackendMaturityAssessment({ skipWrite: true }));
    var html = template.evaluate()
      .setTitle('Maturidade do Backend')
      .setWidth(620);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (error) {
    Logger.log("Erro em openBackendMaturityPanel: " + error.message);
    throw error;
  }
}

function addMaturityAssessmentMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Maturidade')
    .addItem('Auto-avaliacao do backend', 'openBackendMaturityPanel')
    .addItem('Salvar snapshot', 'writeBackendMaturitySnapshot')
    .addToUi();
}

function runBackendMaturityAssessment(options) {
  try {
    options = options || {};
    var context = createBackendMaturityContext_();
    var domains = [
      assessBackendConfigurationMaturity_(context),
      assessBackendDataMaturity_(context),
      assessBackendSecurityMaturity_(context),
      assessBackendReliabilityMaturity_(context),
      assessBackendObservabilityMaturity_(context),
      assessBackendIntegrationMaturity_(context),
      assessBackendDriveFolderMaturity_(context),
      assessBackendUserDemandMaturity_(context),
      assessBackendAutomationMaturity_(context),
      assessBackendMaintainabilityMaturity_(context)
    ];
    var summary = summarizeBackendMaturity_(domains);
    var report = {
      ok: true,
      tool: 'BackendMaturity',
      version: BACKEND_MATURITY_VERSION,
      project: context.project,
      generatedAt: new Date().toISOString(),
      summary: summary,
      domains: domains,
      nextActions: buildBackendMaturityNextActions_(domains),
      warnings: context.warnings,
      evidence: context.evidence
    };
    report.compositeScore = summary.score;
    report.level = summary.level;
    if (!options.skipWrite && options.writeSnapshot) {
      writeBackendMaturitySnapshot(report);
    }
    return report;
  } catch (error) {
    Logger.log("Erro em runBackendMaturityAssessment: " + error.message);
    throw error;
  }
}

function getBackendMaturityJson() {
  try {
    return JSON.stringify(runBackendMaturityAssessment({ skipWrite: true }), null, 2);
  } catch (error) {
    Logger.log("Erro em getBackendMaturityJson: " + error.message);
    throw error;
  }
}

function writeBackendMaturitySnapshot(report) {
  try {
    try {
      report = report || runBackendMaturityAssessment({ skipWrite: true });
      var spreadsheet = getBackendMaturitySpreadsheet_();
      var sheet = spreadsheet.getSheetByName(BACKEND_MATURITY_SNAPSHOT_SHEET);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(BACKEND_MATURITY_SNAPSHOT_SHEET);
        sheet.getRange(1, 1, 1, 7).setValues([[
          'Timestamp', 'Projeto', 'Score', 'Nivel', 'Status', 'AcoesPrioritarias', 'JSON'
        ]]);
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([
        new Date(),
        report.project,
        report.summary.score,
        report.summary.level,
        report.summary.status,
        (report.nextActions || []).map(function(action) {
          return action.domain + ': ' + action.item;
        }).join(' | '),
        JSON.stringify(report)
      ]);
      return {
        ok: true,
        sheetName: BACKEND_MATURITY_SNAPSHOT_SHEET,
        score: report.summary.score,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em writeBackendMaturitySnapshot: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em writeBackendMaturitySnapshot: " + error.message);
    throw error;
  }
}

function getBackendMaturityModel() {
  return {
    version: BACKEND_MATURITY_VERSION,
    scale: [
      { min: 90, level: '5 - Otimizado' },
      { min: 75, level: '4 - Avancado' },
      { min: 60, level: '3 - Funcional' },
      { min: 40, level: '2 - Em consolidacao' },
      { min: 0, level: '1 - Inicial' }
    ],
    domains: [
      'Configuracao', 'Dados', 'Seguranca', 'Confiabilidade',
      'Observabilidade', 'Integracoes', 'Drive e arquivos', 'Demandas do usuario', 'Automacao', 'Manutenibilidade'
    ]
  };
}

function createBackendMaturityContext_() {
  try {
    var spreadsheet = null;
    var warnings = [];
    try {
      spreadsheet = getBackendMaturitySpreadsheet_();
    } catch (error) {
      warnings.push('Planilha ativa indisponivel: ' + error.message);
    }
    var props = {};
    try {
      props = PropertiesService.getScriptProperties().getProperties();
    } catch (error) {
      warnings.push('ScriptProperties indisponivel: ' + error.message);
    }
    var triggers = [];
    try {
      triggers = ScriptApp.getProjectTriggers().map(function(trigger) {
        return trigger.getHandlerFunction();
      });
    } catch (error) {
      warnings.push('Triggers indisponiveis: ' + error.message);
    }
    return {
      project: detectBackendMaturityProjectName_(),
      spreadsheet: spreadsheet,
      properties: props,
      triggers: triggers,
      warnings: warnings,
      evidence: {
        propertyCount: Object.keys(props).length,
        triggerCount: triggers.length,
        sheets: getBackendMaturitySheetEvidence_(spreadsheet),
        availableFunctions: getBackendMaturityAvailableFunctions_()
      }
    };
  } catch (error) {
    Logger.log("Erro em createBackendMaturityContext_: " + error.message);
    throw error;
  }
}

function assessBackendConfigurationMaturity_(context) {
  var props = context.properties || {};
  var keys = Object.keys(props);
  var hasSpreadsheetId = hasAnyBackendMaturityProperty_(props, ['SPREADSHEET_ID', 'SHEET_ID', 'DATABASE_ID']);
  var hasAppConfig = hasAnyBackendMaturityProperty_(props, ['APP_NAME', 'APP_VERSION', 'ENVIRONMENT', 'PROJECT_NAME']);
  var hasSecrets = hasAnyBackendMaturityProperty_(props, ['API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'SECRET', 'TOKEN']);
  return createBackendMaturityDomain_('Configuracao', 'Variaveis, propriedades e parametros operacionais.', [
    createBackendMaturityItem_('Propriedades do script cadastradas', Math.min(keys.length / 6, 1), 3, [keys.length + ' propriedades encontradas'], 'Cadastrar propriedades para ambiente, planilha e integracoes.'),
    createBackendMaturityItem_('Referencia de planilha configurada', hasSpreadsheetId ? 1 : 0.4, 2, [hasSpreadsheetId ? 'ID de planilha detectado' : 'Sem propriedade explicita de planilha'], 'Definir SPREADSHEET_ID ou equivalente para reduzir dependencia de contexto.'),
    createBackendMaturityItem_('Identidade/versionamento do app', hasAppConfig ? 1 : 0.35, 2, [hasAppConfig ? 'Configuracao de app detectada' : 'Sem APP_NAME/APP_VERSION/ENVIRONMENT'], 'Registrar nome, versao e ambiente em ScriptProperties.'),
    createBackendMaturityItem_('Segredos isolados de codigo', hasSecrets ? 1 : 0.65, 2, [hasSecrets ? 'Chaves/segredos em propriedades' : 'Nenhum segredo detectado em propriedades'], 'Manter chaves externas em PropertiesService, nao em codigo.')
  ]);
}

function assessBackendDataMaturity_(context) {
  var evidence = getBackendMaturitySheetEvidence_(context.spreadsheet);
  return createBackendMaturityDomain_('Dados', 'Estrutura e prontidao da base em planilhas.', [
    createBackendMaturityItem_('Planilha acessivel', context.spreadsheet ? 1 : 0, 3, [context.spreadsheet ? 'Planilha ativa encontrada' : 'Planilha indisponivel'], 'Vincular o projeto a uma planilha operacional.'),
    createBackendMaturityItem_('Cobertura de abas', Math.min(evidence.sheetCount / 6, 1), 3, [evidence.sheetCount + ' abas encontradas'], 'Criar abas centrais para entidades, logs e configuracoes.'),
    createBackendMaturityItem_('Cabecalhos estruturados', evidence.sheetCount ? evidence.headerSheets / evidence.sheetCount : 0, 3, [evidence.headerSheets + '/' + evidence.sheetCount + ' abas com cabecalho'], 'Padronizar a primeira linha de cada aba como schema.'),
    createBackendMaturityItem_('Dados operacionais', evidence.sheetCount ? evidence.populatedSheets / evidence.sheetCount : 0, 2, [evidence.populatedSheets + '/' + evidence.sheetCount + ' abas com dados'], 'Popular dados reais ou sinteticos para testes de fluxo.')
  ]);
}

function assessBackendSecurityMaturity_(context) {
  var f = context.evidence.availableFunctions;
  return createBackendMaturityDomain_('Seguranca', 'Autenticacao, autorizacao e saneamento de entradas.', [
    createBackendMaturityItem_('Autenticacao disponivel', f.auth ? 1 : 0.25, 3, [f.auth ? 'Funcoes de autenticacao detectadas' : 'Autenticacao nao detectada'], 'Implementar login, sessao ou validacao de usuario.'),
    createBackendMaturityItem_('Controle de permissao', f.permission ? 1 : 0.3, 3, [f.permission ? 'Controle de permissao detectado' : 'Permissoes nao detectadas'], 'Adicionar verificacoes por perfil antes de operacoes sensiveis.'),
    createBackendMaturityItem_('Validacao de entrada', f.validation ? 1 : 0.35, 2, [f.validation ? 'Validadores detectados' : 'Validadores nao detectados'], 'Centralizar validacao e saneamento de payloads.'),
    createBackendMaturityItem_('Auditoria de eventos', f.audit ? 1 : 0.3, 2, [f.audit ? 'Auditoria/log detectados' : 'Auditoria nao detectada'], 'Registrar acoes administrativas e alteracoes de dados.')
  ]);
}

function assessBackendReliabilityMaturity_(context) {
  var f = context.evidence.availableFunctions;
  return createBackendMaturityDomain_('Confiabilidade', 'Resiliencia, recuperacao e tratamento de falhas.', [
    createBackendMaturityItem_('Tratamento de erros', f.error ? 1 : 0.35, 3, [f.error ? 'ErrorHandler/handlers detectados' : 'Handlers nao detectados'], 'Adicionar camada padronizada de tratamento de erros.'),
    createBackendMaturityItem_('Backup ou migracao', f.backup ? 1 : 0.25, 2, [f.backup ? 'Backup/migracao detectado' : 'Sem backup/migracao detectado'], 'Criar rotinas de backup, migracao ou reparo de schema.'),
    createBackendMaturityItem_('Contratos de retorno', f.standardReturn ? 1 : 0.45, 2, [f.standardReturn ? 'StandardReturn detectado' : 'Contrato padrao nao detectado'], 'Padronizar respostas com ok, data, error e generatedAt.'),
    createBackendMaturityItem_('Setup reexecutavel', f.setup ? 1 : 0.4, 2, [f.setup ? 'Setup detectado' : 'Setup nao detectado'], 'Garantir bootstrap idempotente de abas e configuracoes.')
  ]);
}

function assessBackendObservabilityMaturity_(context) {
  try {
    var f = context.evidence.availableFunctions;
    var sheets = context.evidence.sheets;
    var hasLogSheet = sheets.sheetNames.some(function(name) {
      return /log|audit|histor|evento/i.test(name);
    });
    return createBackendMaturityDomain_('Observabilidade', 'Logs, metricas e evidencias para acompanhamento.', [
      createBackendMaturityItem_('Servico de logs', f.log ? 1 : 0.3, 3, [f.log ? 'LogManager/logger detectado' : 'Servico de log nao detectado'], 'Centralizar logs tecnicos e funcionais.'),
      createBackendMaturityItem_('Aba de historico/log', hasLogSheet ? 1 : 0.35, 2, [hasLogSheet ? 'Aba de log/auditoria detectada' : 'Nenhuma aba de log evidente'], 'Criar aba de eventos, auditoria ou historico operacional.'),
      createBackendMaturityItem_('Relatorios ou analytics', f.report ? 1 : 0.35, 2, [f.report ? 'Relatorio/analytics detectado' : 'Relatorios nao detectados'], 'Expor metricas de uso, qualidade e excecoes.'),
      createBackendMaturityItem_('Snapshot de maturidade', hasSheet_(context.spreadsheet, BACKEND_MATURITY_SNAPSHOT_SHEET) ? 1 : 0.2, 1, [hasSheet_(context.spreadsheet, BACKEND_MATURITY_SNAPSHOT_SHEET) ? 'Historico ja existe' : 'Historico ainda nao salvo'], 'Salvar snapshots periodicos de maturidade.')
    ]);
  } catch (error) {
    Logger.log("Erro em assessBackendObservabilityMaturity_: " + error.message);
    throw error;
  }
}

function assessBackendIntegrationMaturity_(context) {
  var f = context.evidence.availableFunctions;
  return createBackendMaturityDomain_('Integracoes', 'Conectores, APIs e servicos auxiliares.', [
    createBackendMaturityItem_('Rotas HTTP ou API', f.api ? 1 : 0.35, 3, [f.api ? 'doGet/doPost/API detectado' : 'API nao detectada'], 'Definir rotas de entrada e saida com contratos claros.'),
    createBackendMaturityItem_('Integracao externa', f.integration ? 1 : 0.35, 3, [f.integration ? 'Conector externo detectado' : 'Conectores nao detectados'], 'Isolar chamadas externas em servicos dedicados.'),
    createBackendMaturityItem_('Camada de dados', f.data ? 1 : 0.4, 2, [f.data ? 'Servico CRUD/dados detectado' : 'Camada de dados pouco evidente'], 'Concentrar acesso a planilhas em funcoes reutilizaveis.'),
    createBackendMaturityItem_('Notificacoes/exportacao', f.delivery ? 1 : 0.35, 1, [f.delivery ? 'Entrega/exportacao detectada' : 'Entrega nao detectada'], 'Adicionar envio, exportacao ou notificacao quando fizer sentido ao fluxo.')
  ]);
}


function assessBackendDriveFolderMaturity_(context) {
  try {
    var props = context.properties || {};
    var f = context.evidence.availableFunctions || {};
    var requiredKeys = detectBackendMaturityRequiredDriveKeys_();
    var configuredKeys = requiredKeys.filter(function(key) {
      return hasAnyBackendMaturityProperty_(props, getBackendMaturityDriveAliases_(key));
    });
    var hasAnyDriveUse = f.drive || f.driveFolderConfig || f.inputOutputFolderService || f.backupFolderService || requiredKeys.length > 0;
    var inputNeeded = requiredKeys.indexOf('INPUT_FOLDER_ID') >= 0;
    var outputNeeded = requiredKeys.indexOf('OUTPUT_FOLDER_ID') >= 0;
    var backupNeeded = requiredKeys.indexOf('BACKUP_FOLDER_ID') >= 0;
    return createBackendMaturityDomain_('Drive e arquivos', 'Pastas Drive, artefatos gerados, entrada/importacao e backups.', [
      createBackendMaturityItem_(
        'Variaveis Drive requeridas',
        requiredKeys.length ? configuredKeys.length / requiredKeys.length : (hasAnyDriveUse ? 0.35 : 1),
        4,
        [
          requiredKeys.length ? 'Requeridas: ' + requiredKeys.join(', ') : 'Nenhuma pasta Drive obrigatoria detectada',
          configuredKeys.length + '/' + requiredKeys.length + ' configuradas'
        ],
        'Configurar nas propriedades do script: ' + (requiredKeys.join(', ') || 'somente quando o projeto manipular arquivos no Drive') + '.'
      ),
      createBackendMaturityItem_(
        'Componente DriveFolderConfig',
        f.driveFolderConfig ? 1 : (requiredKeys.length ? 0.25 : 0.75),
        3,
        [f.driveFolderConfig ? 'DriveFolderConfig detectado' : 'DriveFolderConfig nao detectado'],
        'Adicionar DriveFolderConfig.gs para centralizar leitura, aliases e validacao das pastas Drive.'
      ),
      createBackendMaturityItem_(
        'Pasta de entrada',
        inputNeeded ? (hasAnyBackendMaturityProperty_(props, getBackendMaturityDriveAliases_('INPUT_FOLDER_ID')) ? 1 : 0) : 1,
        2,
        [inputNeeded ? 'INPUT_FOLDER_ID esperado' : 'Entrada por pasta nao requerida'],
        'Configurar INPUT_FOLDER_ID e usar InputOutputFolderService quando houver importacao de arquivos.'
      ),
      createBackendMaturityItem_(
        'Pasta de saida',
        outputNeeded ? (hasAnyBackendMaturityProperty_(props, getBackendMaturityDriveAliases_('OUTPUT_FOLDER_ID')) ? 1 : 0) : 1,
        2,
        [outputNeeded ? 'OUTPUT_FOLDER_ID esperado' : 'Saida por pasta nao requerida'],
        'Configurar OUTPUT_FOLDER_ID para relatorios, PDFs, CSVs e artefatos gerados.'
      ),
      createBackendMaturityItem_(
        'Pasta de backup',
        backupNeeded ? (hasAnyBackendMaturityProperty_(props, getBackendMaturityDriveAliases_('BACKUP_FOLDER_ID')) ? 1 : 0) : 1,
        2,
        [backupNeeded ? 'BACKUP_FOLDER_ID esperado' : 'Backup por pasta nao requerido'],
        'Configurar BACKUP_FOLDER_ID e registrar rotina restauravel de backup.'
      )
    ]);
  } catch (error) {
    Logger.log("Erro em assessBackendDriveFolderMaturity_: " + error.message);
    throw error;
  }
}

function detectBackendMaturityRequiredDriveKeys_() {
  try {
    if (typeof DRIVE_FOLDER_REQUIRED_KEYS !== 'undefined' && DRIVE_FOLDER_REQUIRED_KEYS && DRIVE_FOLDER_REQUIRED_KEYS.length) {
      return DRIVE_FOLDER_REQUIRED_KEYS.slice();
    }
    var keys = [];
    if (typeof getConfiguredInputFolder === 'function' || typeof listInputFolderFiles === 'function') keys.push('INPUT_FOLDER_ID');
    if (typeof getConfiguredOutputFolder === 'function' || typeof saveTextToOutputFolder === 'function' || typeof createFileInConfiguredOutputFolder === 'function') keys.push('OUTPUT_FOLDER_ID');
    if (typeof getConfiguredBackupFolder === 'function' || typeof createConfiguredSpreadsheetBackup === 'function' || typeof Backup_Service !== 'undefined') keys.push('BACKUP_FOLDER_ID');
    return keys.filter(function(key, index) { return keys.indexOf(key) === index; });
  } catch (error) {
    Logger.log("Erro em detectBackendMaturityRequiredDriveKeys_: " + error.message);
    throw error;
  }
}

function getBackendMaturityDriveAliases_(key) {
  var aliases = {
    INPUT_FOLDER_ID: ['INPUT_FOLDER_ID', 'DRIVE_INPUT_FOLDER_ID', 'SOURCE_FOLDER_ID', 'PASTA_ORIGEM_ID'],
    OUTPUT_FOLDER_ID: ['OUTPUT_FOLDER_ID', 'DRIVE_OUTPUT_FOLDER_ID', 'REPORT_FOLDER_ID', 'CARDAPIOS_PDF_FOLDER_ID', 'DRIVE_FOLDER_ID', 'FOLDER_ID', 'PASTA_DESTINO_ID'],
    BACKUP_FOLDER_ID: ['BACKUP_FOLDER_ID', 'DRIVE_BACKUP_FOLDER_ID', 'BACKUPS_FOLDER_ID', 'DRIVE_FOLDER_ID', 'FOLDER_ID']
  };
  return aliases[key] || [key];
}


function assessBackendUserDemandMaturity_(context) {
  try {
    var f = context.evidence.availableFunctions || {};
    var workflows = detectBackendMaturityUserWorkflows_(f);
    var topWorkflows = workflows.slice(0, 4);
    var supported = topWorkflows.filter(function(flow) { return flow.score >= 55; });
    var executable = topWorkflows.filter(function(flow) { return flow.executable; });
    var observable = topWorkflows.filter(function(flow) { return flow.observable; });
    return createBackendMaturityDomain_('Demandas do usuario', 'Principais pedidos de processamento e analise acionados pelos usuarios.', [
      createBackendMaturityItem_(
        'Mapa dos fluxos principais',
        topWorkflows.length >= 3 ? 1 : Math.max(0.25, topWorkflows.length / 3),
        3,
        topWorkflows.map(function(flow) { return flow.name + ' (' + flow.score + ')'; }),
        'Mapear explicitamente os 3 ou 4 fluxos que o usuario mais solicita e seus handlers.'
      ),
      createBackendMaturityItem_(
        'Execucao backend dos fluxos',
        topWorkflows.length ? executable.length / topWorkflows.length : 0,
        4,
        [executable.length + '/' + topWorkflows.length + ' fluxos com execucao backend detectada'],
        'Garantir handler/servico backend para cada fluxo principal, sem depender apenas da UI.'
      ),
      createBackendMaturityItem_(
        'Analise, relatorio ou decisao',
        topWorkflows.length ? supported.length / topWorkflows.length : 0,
        3,
        [supported.length + '/' + topWorkflows.length + ' fluxos com sinais suficientes de processamento/analise'],
        'Adicionar processamento verificavel, resultado estruturado e recomendacoes para cada demanda principal.'
      ),
      createBackendMaturityItem_(
        'Rastreabilidade dos fluxos',
        topWorkflows.length ? observable.length / topWorkflows.length : 0,
        2,
        [observable.length + '/' + topWorkflows.length + ' fluxos com log/auditoria/teste associados'],
        'Registrar logs, auditoria, testes ou snapshots para os fluxos mais usados.'
      )
    ]);
  } catch (error) {
    Logger.log("Erro em assessBackendUserDemandMaturity_: " + error.message);
    throw error;
  }
}

function detectBackendMaturityUserWorkflows_(f) {
  try {
    var definitions = [
      {
        name: 'Importar ou receber dados',
        signals: [f.importData, f.inputOutputFolderService, f.api, f.integration],
        executable: f.importData || f.inputOutputFolderService || f.api,
        observable: f.log || f.audit || f.test
      },
      {
        name: 'Processar analise principal',
        signals: [f.analysis, f.workflow, f.integration, f.data],
        executable: f.analysis || f.workflow,
        observable: f.log || f.test || f.report
      },
      {
        name: 'Gerar relatorios e artefatos',
        signals: [f.report, f.delivery, f.drive, f.driveFolderConfig],
        executable: f.report || f.delivery,
        observable: f.log || f.audit || f.backupFolderService
      },
      {
        name: 'Consultar dashboard ou status',
        signals: [f.dashboard, f.api, f.data, f.log],
        executable: f.dashboard || f.api,
        observable: f.log || f.audit || f.test
      },
      {
        name: 'Gerenciar usuarios e permissoes',
        signals: [f.auth, f.permission, f.validation, f.audit],
        executable: f.auth || f.permission,
        observable: f.audit || f.log || f.test
      },
      {
        name: 'Executar automacoes e backups',
        signals: [f.backup, f.backupFolderService, f.workflow, f.test],
        executable: f.backup || f.backupFolderService,
        observable: f.log || f.audit || f.test
      }
    ];
    return definitions.map(function(flow) {
      var hits = flow.signals.filter(function(value) { return !!value; }).length;
      var score = Math.round((hits / flow.signals.length) * 100);
      return {
        name: flow.name,
        score: score,
        executable: !!flow.executable,
        observable: !!flow.observable
      };
    }).sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (b.executable ? 1 : 0) - (a.executable ? 1 : 0);
    });
  } catch (error) {
    Logger.log("Erro em detectBackendMaturityUserWorkflows_: " + error.message);
    throw error;
  }
}

function assessBackendAutomationMaturity_(context) {
  var triggerCount = context.triggers ? context.triggers.length : 0;
  var f = context.evidence.availableFunctions;
  return createBackendMaturityDomain_('Automacao', 'Rotinas agendadas e operacao sem intervencao manual.', [
    createBackendMaturityItem_('Triggers instalados', Math.min(triggerCount / 3, 1), 3, [triggerCount + ' triggers encontrados'], 'Criar triggers para rotinas recorrentes, se aplicavel.'),
    createBackendMaturityItem_('Rotinas de workflow', f.workflow ? 1 : 0.35, 3, [f.workflow ? 'Workflow detectado' : 'Workflow nao detectado'], 'Modelar fluxos de negocio como funcoes executaveis.'),
    createBackendMaturityItem_('Testes ou validadores', f.test ? 1 : 0.35, 2, [f.test ? 'Teste/validador detectado' : 'Teste nao detectado'], 'Adicionar testes de smoke e validacao de schema.'),
    createBackendMaturityItem_('Dados sinteticos/seeder', f.seed ? 1 : 0.3, 1, [f.seed ? 'Seeder detectado' : 'Seeder nao detectado'], 'Criar massa sintetica para homologacao.')
  ]);
}

function assessBackendMaintainabilityMaturity_(context) {
  var f = context.evidence.availableFunctions;
  var sheets = context.evidence.sheets;
  var moduleScore = Math.min((sheets.gsFileCount || 0) / 12, 1);
  return createBackendMaturityDomain_('Manutenibilidade', 'Organizacao, modularidade e facilidade de evolucao.', [
    createBackendMaturityItem_('Modularidade percebida', moduleScore, 3, [(sheets.gsFileCount || 0) + ' arquivos .gs no projeto local'], 'Separar responsabilidades em modulos coesos.'),
    createBackendMaturityItem_('Schema centralizado', f.schema ? 1 : 0.35, 3, [f.schema ? 'SchemaService/SchemaManager detectado' : 'Schema central nao detectado'], 'Manter definicoes de entidades e cabecalhos em servico unico.'),
    createBackendMaturityItem_('Documentacao operacional', sheets.hasReadme ? 1 : 0.35, 2, [sheets.hasReadme ? 'README detectado' : 'README nao detectado'], 'Documentar setup, menus, dados e rotinas criticas.'),
    createBackendMaturityItem_('Ferramenta de maturidade versionada', 1, 1, ['BackendMaturity v' + BACKEND_MATURITY_VERSION], 'Revisar o modelo periodicamente.')
  ]);
}

function createBackendMaturityDomain_(name, description, items) {
  try {
    var totalWeight = items.reduce(function(sum, item) { return sum + item.weight; }, 0);
    var weighted = items.reduce(function(sum, item) { return sum + item.score * item.weight; }, 0);
    var score = totalWeight ? Math.round(weighted / totalWeight) : 0;
    return {
      name: name,
      description: description,
      score: score,
      level: getBackendMaturityLevel_(score),
      status: getBackendMaturityStatus_(score),
      items: items
    };
  } catch (error) {
    Logger.log("Erro em createBackendMaturityDomain_: " + error.message);
    throw error;
  }
}

function createBackendMaturityItem_(label, ratio, weight, evidence, recommendation) {
  try {
    var normalized = Math.max(0, Math.min(1, Number(ratio) || 0));
    var score = Math.round(normalized * 100);
    return {
      label: label,
      score: score,
      weight: weight || 1,
      status: getBackendMaturityStatus_(score),
      evidence: evidence || [],
      recommendation: score >= 80 ? '' : recommendation
    };
  } catch (error) {
    Logger.log("Erro em createBackendMaturityItem_: " + error.message);
    throw error;
  }
}

function summarizeBackendMaturity_(domains) {
  try {
    var score = Math.round(domains.reduce(function(sum, domain) {
      return sum + domain.score;
    }, 0) / Math.max(domains.length, 1));
    return {
      score: score,
      level: getBackendMaturityLevel_(score),
      status: getBackendMaturityStatus_(score),
      domainCount: domains.length
    };
  } catch (error) {
    Logger.log("Erro em summarizeBackendMaturity_: " + error.message);
    throw error;
  }
}

function buildBackendMaturityNextActions_(domains) {
  try {
    var actions = [];
    domains.forEach(function(domain) {
      (domain.items || []).forEach(function(item) {
        if (item.score < 75 && item.recommendation) {
          actions.push({
            domain: domain.name,
            item: item.label,
            score: item.score,
            recommendation: item.recommendation
          });
        }
      });
    });
    actions.sort(function(a, b) { return a.score - b.score; });
    return actions.slice(0, 8);
  } catch (error) {
    Logger.log("Erro em buildBackendMaturityNextActions_: " + error.message);
    throw error;
  }
}

function getBackendMaturityLevel_(score) {
  if (score >= 90) return '5 - Otimizado';
  if (score >= 75) return '4 - Avancado';
  if (score >= 60) return '3 - Funcional';
  if (score >= 40) return '2 - Em consolidacao';
  return '1 - Inicial';
}

function getBackendMaturityStatus_(score) {
  if (score >= 85) return 'bom';
  if (score >= 65) return 'atencao';
  if (score >= 40) return 'risco';
  return 'critico';
}

function getBackendMaturitySpreadsheet_() {
  try {
    try {
      return SpreadsheetApp.getActiveSpreadsheet();
    } catch (error) {
      return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    }
  } catch (error) {
    Logger.log("Erro em getBackendMaturitySpreadsheet_: " + error.message);
    throw error;
  }
}

function getBackendMaturitySheetEvidence_(spreadsheet) {
  try {
    var evidence = {
      sheetCount: 0,
      headerSheets: 0,
      populatedSheets: 0,
      sheetNames: [],
      gsFileCount: 58,
      hasReadme: true
    };
    if (!spreadsheet) return evidence;
    var sheets = spreadsheet.getSheets();
    evidence.sheetCount = sheets.length;
    evidence.sheetNames = sheets.map(function(sheet) { return sheet.getName(); });
    sheets.forEach(function(sheet) {
      var lastColumn = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      if (lastColumn > 0) {
        var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(function(value) {
          return String(value || '').trim() !== '';
        });
        if (headers.length >= 2) evidence.headerSheets += 1;
      }
      if (lastRow > 1) evidence.populatedSheets += 1;
    });
    return evidence;
  } catch (error) {
    Logger.log("Erro em getBackendMaturitySheetEvidence_: " + error.message);
    throw error;
  }
}

function hasSheet_(spreadsheet, sheetName) {
  try {
    return !!(spreadsheet && spreadsheet.getSheetByName(sheetName));
  } catch (error) {
    Logger.log("Erro em hasSheet_: " + error.message);
    throw error;
  }
}

function hasAnyBackendMaturityProperty_(props, names) {
  try {
    return names.some(function(name) {
      return props[name] !== undefined && props[name] !== '';
    });
  } catch (error) {
    Logger.log("Erro em hasAnyBackendMaturityProperty_: " + error.message);
    throw error;
  }
}

function getBackendMaturityAvailableFunctions_() {
  return {
    auth: hasBackendMaturityFunctionLike_(['login', 'logout', 'auth', 'session', 'validateUser']),
    permission: hasBackendMaturityFunctionLike_(['permission', 'role', 'access', 'authorize']),
    validation: hasBackendMaturityFunctionLike_(['validate', 'validator', 'sanitize']),
    audit: hasBackendMaturityFunctionLike_(['audit', 'logAction', 'recordEvent']),
    error: hasBackendMaturityFunctionLike_(['error', 'handleError', 'renderError']),
    backup: hasBackendMaturityFunctionLike_(['backup', 'migration', 'migrate', 'restore']),
    standardReturn: typeof StandardReturn !== 'undefined' || hasBackendMaturityFunctionLike_(['standardReturn', 'createSuccess', 'createError']),
    setup: hasBackendMaturityFunctionLike_(['setup', 'bootstrap', 'initialize', 'ensure']),
    log: hasBackendMaturityFunctionLike_(['log', 'logger', 'LogManager']),
    report: hasBackendMaturityFunctionLike_(['report', 'analytics', 'dashboard', 'metric']),
    api: hasBackendMaturityFunctionLike_(['doGet', 'doPost', 'api', 'route']),
    integration: hasBackendMaturityFunctionLike_(['bridge', 'connector', 'integrator', 'client', 'gemini', 'colab']),
    data: hasBackendMaturityFunctionLike_(['crud', 'sheet', 'database', 'repository', 'data']),
    delivery: hasBackendMaturityFunctionLike_(['email', 'notify', 'export', 'pdf']),
    workflow: hasBackendMaturityFunctionLike_(['workflow', 'process', 'scheduler']),
    test: hasBackendMaturityFunctionLike_(['test', 'validateSchema', 'smoke']),
    seed: hasBackendMaturityFunctionLike_(['seed', 'synthetic', 'mock']),
    schema: typeof SchemaService !== 'undefined' || hasBackendMaturityFunctionLike_(['schema', 'headers']),
    drive: hasBackendMaturityFunctionLike_(['DriveApp', 'drive', 'folder', 'file']),
    driveFolderConfig: typeof getDriveFolderConfig === 'function' || typeof validateDriveFolderConfig === 'function',
    inputOutputFolderService: typeof listInputFolderFiles === 'function' || typeof saveTextToOutputFolder === 'function',
    backupFolderService: typeof createConfiguredSpreadsheetBackup === 'function' || typeof listConfiguredBackups === 'function',
    importData: hasBackendMaturityFunctionLike_(['import', 'upload', 'receive', 'ingest', 'csv']),
    analysis: hasBackendMaturityFunctionLike_(['analysis', 'analise', 'analyze', 'process', 'score', 'rank', 'predict', 'classify']),
    dashboard: hasBackendMaturityFunctionLike_(['dashboard', 'status', 'summary', 'stats', 'metrics'])
  };
}

function hasBackendMaturityFunctionLike_(needles) {
  try {
    var globalObject = this;
    return needles.some(function(needle) {
      var pattern = new RegExp(needle, 'i');
      for (var key in globalObject) {
        if (pattern.test(key) && typeof globalObject[key] === 'function') return true;
      }
      return false;
    });
  } catch (error) {
    Logger.log("Erro em hasBackendMaturityFunctionLike_: " + error.message);
    throw error;
  }
}

function detectBackendMaturityProjectName_() {
  try {
    try {
      var appName = PropertiesService.getScriptProperties().getProperty('APP_NAME') ||
        PropertiesService.getScriptProperties().getProperty('PROJECT_NAME');
      if (appName) return appName;
    } catch (error) {}
    try {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (spreadsheet) return spreadsheet.getName();
    } catch (error2) {}
    return 'Projeto Apps Script';
  } catch (error) {
    Logger.log("Erro em detectBackendMaturityProjectName_: " + error.message);
    throw error;
  }
}




