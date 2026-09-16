/**
 * @file       Triggers.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Configuração e gerenciamento de gatilhos nativos (Triggers) do
 *   Google Apps Script para automação de tarefas periódicas.
 *
 * @description
 *   Este arquivo define e instala os gatilhos time-driven que executam
 *   tarefas de manutenção sem intervenção manual: limpeza de sessões
 *   expiradas, consolidação noturna de dados biométricos, backup da
 *   planilha no Google Drive e envio de relatórios semanais por e-mail.
 *   Os gatilhos são instalados uma única vez via setupTriggers() e
 *   persistem no projeto do Apps Script.
 *
 * @integrations
 *   Config.gs              : BACKUP_FOLDER_ID, ADMIN_EMAIL, SHEET_NAMES
 *   Database.gs            : Acesso às abas para limpeza e consolidação
 *   ReportController.gs    : Geração do relatório semanal consolidado
 *   Auth.gs                : Limpeza de tokens de sessão expirados
 *
 * @triggers
 *   cleanExpiredSessions()   → Diário às 02:00 (limpeza de tokens)
 *   consolidateDailyData()   → Diário às 03:00 (sumarização biométrica)
 *   backupSpreadsheet()      → Semanal (domingo às 04:00) (backup Drive)
 *   sendWeeklyReport()       → Semanal (segunda às 07:00) (e-mail admin)
 *
 * @gasPermissions
 *   spreadsheets, drive, gmail, script.scriptapp
 */

/**
 * Instala todos os gatilhos do sistema.
 * Deve ser executada manualmente uma única vez pelo administrador.
 * Remove gatilhos existentes antes de criar novos (idempotente).
 */
function setupTriggers() {
  try {
    // Remove todos os gatilhos existentes
    var existing = ScriptApp.getProjectTriggers();
    existing.forEach(function(t) { ScriptApp.deleteTrigger(t); });

    // Limpeza de sessões expiradas — diário às 02:00
    ScriptApp.newTrigger('cleanExpiredSessions')
      .timeBased().everyDays(1).atHour(2).create();

    // Consolidação de dados biométricos — diário às 03:00
    ScriptApp.newTrigger('consolidateDailyData')
      .timeBased().everyDays(1).atHour(3).create();

    // Descarte de dados biométricos brutos fora da janela — diário às 04:00
    ScriptApp.newTrigger('purgeExpiredBiometricRawData')
      .timeBased().everyDays(1).atHour(4).create();

    // Backup da planilha — semanal (domingo às 04:00)
    ScriptApp.newTrigger('backupSpreadsheet')
      .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(4).create();

    // Relatório semanal por e-mail — segunda às 07:00
    ScriptApp.newTrigger('sendWeeklyReport')
      .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();

    LoggerService.info('Triggers.setupTriggers', 'Todos os gatilhos instalados com sucesso.');
  } catch (error) {
    Logger.log("Erro em setupTriggers: " + error.message);
    throw error;
  }
}

/**
 * Remove todos os tokens de sessão expirados da aba SessoesAuth.
 * Executado diariamente às 02:00 via gatilho time-driven.
 */
function cleanExpiredSessions() {
  try {
    var sheet = Database.getSheet(Config.SHEET_NAMES.SESSIONS_AUTH);
    var data  = sheet.getDataRange().getValues();
    var now   = new Date();
    // Itera de baixo para cima para não deslocar índices ao deletar
    for (var i = data.length - 1; i >= 1; i--) {
      var expires = new Date(data[i][3]);
      if (now > expires) sheet.deleteRow(i + 1);
    }
    LoggerService.info('Triggers.cleanExpiredSessions', 'Sessões expiradas removidas.');
  } catch (err) {
    LoggerService.error('Triggers.cleanExpiredSessions', err);
  }
}

/**
 * Consolida os dados biométricos brutos do dia anterior em métricas
 * sumarizadas por estudante, armazenando na aba de cada aplicação.
 * Executado diariamente às 03:00.
 */
function consolidateDailyData() {
  try {
    LoggerService.info('Triggers.consolidateDailyData', 'Iniciando consolidação.');
    // Lógica de sumarização: média de HRV, pico de EDA, razão Teta/Alfa por estudante
    // Delegado ao ReportController_ para manter separação de responsabilidades
    ReportController.consolidateDaily();
    LoggerService.info('Triggers.consolidateDailyData', 'Consolidação concluída.');
  } catch (err) {
    LoggerService.error('Triggers.consolidateDailyData', err);
  }
}

/**
 * Cria uma cópia de backup da planilha principal no Google Drive.
 * Executado semanalmente aos domingos às 04:00.
 */
function backupSpreadsheet() {
  try {
    var ss     = SpreadsheetApp.openById(Config.getSpreadsheetId());
    var folder = DriveApp.getFolderById(Config.BACKUP_FOLDER_ID);
    var name   = 'NeuroEdu_Backup_' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd');
    ss.copy(name).getParents().next(); // Cria cópia
    // Move para a pasta de backup
    var file = DriveApp.getFilesByName(name).next();
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    LoggerService.info('Triggers.backupSpreadsheet', 'Backup criado: ' + name);
  } catch (err) {
    LoggerService.error('Triggers.backupSpreadsheet', err);
  }
}

/**
 * Gera e envia por e-mail o relatório semanal consolidado para o admin.
 * Executado semanalmente às segundas às 07:00.
 */
function sendWeeklyReport() {
  try {
    var reportResponse = ReportController.generateWeeklySummary();
    var report = ResponseHandler.dataOf(reportResponse, reportResponse);
    MailApp.sendEmail({
      to      : Config.ADMIN_EMAIL,
      subject : 'NeuroEdu — Relatório Semanal ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy'),
      body    : report.textBody,
      htmlBody: report.htmlBody
    });
    LoggerService.info('Triggers.sendWeeklyReport', 'E-mail enviado para ' + Config.ADMIN_EMAIL);
  } catch (err) {
    LoggerService.error('Triggers.sendWeeklyReport', err);
  }
}
