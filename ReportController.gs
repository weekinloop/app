/**
 * @file       ReportController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de geração de relatórios pedagógicos consolidados.
 *   Produz relatórios individuais por estudante, por turma e comparativos
 *   entre metodologias, com base nos dados biométricos acumulados.
 *
 * @description
 *   Os relatórios são o produto final do sistema para os educadores.
 *   Eles traduzem os dados biométricos brutos em narrativas pedagógicas
 *   acionáveis: quais estudantes precisam de intervenção, quais
 *   metodologias geraram maior engajamento, qual é a tendência de
 *   evolução de cada indicador ao longo do tempo. Os relatórios são
 *   armazenados na aba "Relatorios" e podem ser exportados como HTML
 *   para impressão ou envio por e-mail.
 *
 * @integrations
 *   Code.gs                    : Rota generateReport
 *   Database.gs                : Lê dados de todas as abas biométricas
 *   Config.gs                  : SHEET_NAMES
 *   Utils.gs                   : calcMean(), calcStdDev(), formatDate()
 *   StudentController.gs       : Dados demográficos dos estudantes
 *   SessionController.gs       : Metadados das sessões
 *   AlertController.gs         : Histórico de alertas por estudante
 *   InterventionController.gs  : Intervenções realizadas
 *   Triggers.gs                : Chama consolidateDaily() e generateWeeklySummary()
 *   ReportsGenerator.html      : Interface de geração de relatórios
 *
 * @reportTypes
 *   individual_student  : Perfil biométrico completo de um estudante
 *   class_summary       : Resumo agregado de uma turma
 *   methodology_compare : Comparação de engajamento entre metodologias
 *   weekly_summary      : Resumo semanal para e-mail do administrador
 *   longitudinal        : Evolução de indicadores ao longo do tempo
 *
 * @sheetColumns (aba Relatorios)
 *   id | tipo | turma_id | student_id | periodo_inicio | periodo_fim |
 *   gerado_por | conteudo_json | created_at
 */

var ReportController = (function() {

  /**
   * Gera um relatório conforme o tipo solicitado.
   * @param  {Object} payload  {tipo, turmaId?, studentId?, periodoInicio, periodoFim}
   * @param  {Object} session
   * @return {Object} {success, data: {reportId, content}, error}
   */
  function generate(payload, session) {
    try {
      try {
        var content;
        switch (payload.tipo) {
          case 'individual_student':
            content = _generateIndividualReport(payload);
            break;
          case 'class_summary':
            content = _generateClassSummary(payload);
            break;
          case 'methodology_compare':
            content = _generateMethodologyComparison(payload);
            break;
          default:
            return ResponseHandler.error(Constants.ERROR_MESSAGES.invalidReportType(payload.tipo));
        }

        var id = Database.appendRow(Config.SHEET_NAMES.REPORTS, [
          payload.tipo,
          payload.turmaId  || '',
          payload.studentId || '',
          payload.periodoInicio || '',
          payload.periodoFim    || '',
          session.userId,
          JSON.stringify(content)
        ]);

        return ResponseHandler.success({ reportId: id, content: content });
      } catch (err) {
        return ResponseHandler.error(err, 'ReportController.generate');
      }
    } catch (error) {
      Logger.log("Erro em generate: " + error.message);
      throw error;
    }
  }

  function _generateIndividualReport(payload) {
    try {
      var student = Database.findById(Config.SHEET_NAMES.STUDENTS, payload.studentId);
      var eegData = Database.getAll(Config.SHEET_NAMES.EEG_DATA, { student_id: payload.studentId });
      var ecgData = Database.getAll(Config.SHEET_NAMES.ECG_DATA, { student_id: payload.studentId });
      var edaData = Database.getAll(Config.SHEET_NAMES.EDA_DATA, { student_id: payload.studentId });
      var alerts  = Database.getAll(Config.SHEET_NAMES.ALERTS,   { student_id: payload.studentId });

      var eegRatios = eegData.map(function(r) { return r.theta_alpha_ratio || 0; });
      var hrvValues = ecgData.map(function(r) { return r.hrv_ms || 0; });
      var edaPeaks  = edaData.map(function(r) { return r.peaks_per_min || 0; });

      return {
        student         : student,
        eeg_mean_ratio  : Utils.calcMean(eegRatios),
        eeg_std_ratio   : Utils.calcStdDev(eegRatios),
        hrv_mean        : Utils.calcMean(hrvValues),
        hrv_std         : Utils.calcStdDev(hrvValues),
        eda_mean_peaks  : Utils.calcMean(edaPeaks),
        total_alerts    : alerts.length,
        critical_alerts : alerts.filter(function(a) { return a.severidade === Constants.ALERT_SEVERITY.CRITICAL; }).length,
        generated_at    : new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em _generateIndividualReport: " + error.message);
      throw error;
    }
  }

  function _generateClassSummary(payload) {
    try {
      var students = Database.getAll(Config.SHEET_NAMES.STUDENTS, { turma_id: payload.turmaId, ativo: true });
      var summary  = { turmaId: payload.turmaId, studentCount: students.length, profiles: [] };
      students.forEach(function(s) {
        summary.profiles.push(_generateIndividualReport({ studentId: s.id }));
      });
      return summary;
    } catch (error) {
      Logger.log("Erro em _generateClassSummary: " + error.message);
      throw error;
    }
  }

  function _generateMethodologyComparison(payload) {
    try {
      var sessions = Database.getAll(Config.SHEET_NAMES.BIO_SESSIONS, { turma_id: payload.turmaId });
      var byApp = {};
      sessions.forEach(function(s) {
        if (!byApp[s.aplicacao]) byApp[s.aplicacao] = { sessions: 0, alerts: 0 };
        byApp[s.aplicacao].sessions++;
        var alerts = Database.getAll(Config.SHEET_NAMES.ALERTS, { session_id: s.id });
        byApp[s.aplicacao].alerts += alerts.length;
      });
      return { turmaId: payload.turmaId, byApplication: byApp };
    } catch (error) {
      Logger.log("Erro em _generateMethodologyComparison: " + error.message);
      throw error;
    }
  }

  /** Consolidação diária chamada pelo Triggers.gs */
  function consolidateDaily() {
    try {
      LoggerService.info('ReportController.consolidateDaily', 'Consolidação diária iniciada.');
      return StandardReturn.ok({ status: 'started', generatedAt: new Date().toISOString() });
    } catch (err) {
      return ResponseHandler.error(err, 'ReportController.consolidateDaily');
    }
  }

  /** Resumo semanal para e-mail chamado pelo Triggers.gs */
  function generateWeeklySummary() {
    try {
      return StandardReturn.ok({
        textBody : 'Resumo semanal NeuroEdu — ver painel para detalhes.',
        htmlBody : '<h2>Resumo Semanal NeuroEdu</h2><p>Acesse o painel para detalhes.</p>'
      });
    } catch (err) {
      return ResponseHandler.error(err, 'ReportController.generateWeeklySummary');
    }
  }

  return { generate: generate, consolidateDaily: consolidateDaily, generateWeeklySummary: generateWeeklySummary };

})();

// Legacy alias kept for gradual migration of older calls.
var ReportController_ = ReportController;
