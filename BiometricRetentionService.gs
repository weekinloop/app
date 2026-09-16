/**
 * Descarte autoritativo de dados biométricos brutos.
 * Remove somente as quatro modalidades brutas e chunks da fila, nunca
 * cadastros, consentimentos, decisões humanas ou relatórios consolidados.
 */
var BiometricRetentionService = (function() {
  var DEFAULT_DAYS = 30;
  var MAX_DAYS = 90;

  function retentionDays_() {
    var raw = PropertiesService.getScriptProperties().getProperty('BIOMETRIC_RAW_RETENTION_DAYS');
    var days = Number(raw || DEFAULT_DAYS);
    if (!isFinite(days) || days < 1 || days > MAX_DAYS) return DEFAULT_DAYS;
    return Math.floor(days);
  }

  function rawSheets_() {
    return [
      Config.SHEET_NAMES.EEG_DATA,
      Config.SHEET_NAMES.ECG_DATA,
      Config.SHEET_NAMES.EDA_DATA,
      Config.SHEET_NAMES.POG_DATA
    ].filter(Boolean);
  }

  function purgeQueueFiles_(cutoff) {
    var folderId = PropertiesService.getScriptProperties().getProperty('BIOMETRIC_QUEUE_FOLDER_ID');
    if (!folderId) return 0;
    var files = DriveApp.getFolderById(folderId).getFiles();
    var removed = 0;
    while (files.hasNext()) {
      var file = files.next();
      if (/^bio_/.test(file.getName()) && file.getDateCreated().getTime() < cutoff.getTime()) {
        file.setTrashed(true);
        removed++;
      }
    }
    return removed;
  }

  function purgeExpiredRawData() {
    var days = retentionDays_();
    var cutoff = new Date(Date.now() - days * 86400000);
    var rowsBySheet = {};
    rawSheets_().forEach(function(sheetName) {
      rowsBySheet[sheetName] = Database.deleteBiometricRowsOlderThan(sheetName, cutoff);
    });
    var filesRemoved = purgeQueueFiles_(cutoff);
    LoggerService.info('BiometricRetentionService.purgeExpiredRawData', 'Retencao biometrica aplicada.', {
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      rowsBySheet: rowsBySheet,
      queueFilesRemoved: filesRemoved
    });
    return { retentionDays: days, cutoff: cutoff.toISOString(), rowsBySheet: rowsBySheet, queueFilesRemoved: filesRemoved };
  }

  return { purgeExpiredRawData: purgeExpiredRawData };
})();

function purgeExpiredBiometricRawData() {
  return BiometricRetentionService.purgeExpiredRawData();
}
