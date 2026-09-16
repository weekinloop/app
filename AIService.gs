/**
 * @file       AIService.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @summary    Leitura pedagógica do painel via Google Gemini.
 *
 * @description
 *   Recebe as MÉTRICAS AGREGADAS do dashboard (apenas contagens — nenhum dado
 *   biométrico individual de estudante é enviado à IA) e pede ao Gemini um
 *   resumo interpretativo curto para apoiar a coordenação pedagógica.
 *
 * ⚠️ PROTEÇÃO DE DADOS BIOMÉTRICOS DE CRIANÇAS (fundamentos.md 3.3.5.5):
 *   Dados biométricos individuais de crianças NÃO devem alimentar modelos de IA
 *   externos sem consentimento específico e revisão por comitê de ética.
 *   
 *   GARANTIAS IMPLEMENTADAS:
 *   1. generateInsights(): envia apenas MÉTRICAS AGREGADAS (contagens, sem dados individuais)
 *   2. generateFocusProfile() e generateReadingPattern(): 
 *      - Exigem consentimento específico via requireGenerativeConsent_()
 *      - ConsentService.check(subjectId, 'generative') valida antes de envio
 *      - Enviam apenas métricas AGREGADAS da sessão (médias, somas, distribuições)
 *      - NUNCA enviam: nome, identificador pessoal, séries temporais brutas
 *   3. Dados enviados: estatísticas descritivas (ex: "fixação média 280ms, 12 regressões")
 *   4. Dados NÃO enviados: amostras individuais, séries temporais, identificadores
 *   5. Prompts instruem modelo: "estado momentâneo", "não diagnóstico", "sem rótulo"
 *
 * @config
 *   Requer a propriedade de script GEMINI_API_KEY
 *   (script.google.com → Configurações do projeto → Propriedades do script).
 *   Sem a chave, a rota responde com um erro amigável e o resto do sistema
 *   continua funcionando.
 *
 * @route  getAiInsights  (registrada em Code.gs → _dispatch)
 */

var AIService = (function() {
  var BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

  // FROTA-07: modelo lido da property do script, nunca hardcoded; cai no padrão local.
  function model_() {
    try {
      return PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || 'gemini-2.0-flash';
    } catch (e) {
      Logger.log('WeekInLoop/FROTA-07 property indisponível: ' + e.message);
      return 'gemini-2.0-flash';
    }
  }

  function getApiKey_() {
    return Config.getProperty('GEMINI_API_KEY');
  }

  function isConfigured() {
    var key = getApiKey_();
    return Boolean(key && key.length > 10);
  }

  function requireGenerativeConsent_(payload) {
    payload = payload || {};
    var subjectIds = Array.isArray(payload.subjectIds)
      ? payload.subjectIds
      : [payload.studentId || (payload.data && payload.data.studentId)];
    subjectIds = subjectIds.map(function(id) { return String(id || '').trim(); }).filter(Boolean);
    if (!subjectIds.length) {
      return ResponseHandler.error('Informe o estudante coberto pelo consentimento generativo.', 'CONSENT_REQUIRED');
    }
    try {
      subjectIds.forEach(function(subjectId) { ConsentService.check(subjectId, 'generative'); });
      return null;
    } catch (error) {
      if (error.isConsentError) {
        return ResponseHandler.error(
          'Consentimento ausente ou inválido para geração de IA: ' + error.status,
          'CONSENT_REQUIRED'
        );
      }
      throw error;
    }
  }

  function reviewedDraft_(useCase, data) {
    var content = String(data && data.insight || '').trim();
    return HumanReviewService.decorateResult(useCase, data, content);
  }

  /**
   * Gera insights pedagógicos a partir das métricas do dashboard.
   * @param {Object} payload {token, ...}
   * @param {Object} session Sessão validada.
   * @return {Object} Envelope ResponseHandler.
   */
  function generateInsights(payload, session) {
    var consentFailure = requireGenerativeConsent_(payload);
    if (consentFailure) return consentFailure;
    if (!isConfigured()) {
      return ResponseHandler.error(
        'Análise por IA indisponível: configure a chave GEMINI_API_KEY nas propriedades do script.'
      );
    }

    var dashboard = _getDashboard(payload, session);
    if (!ResponseHandler.isSuccess(dashboard)) return dashboard;

    var metrics = (ResponseHandler.dataOf(dashboard, {}) || {}).metrics || {};

    try {
      var insight = callGemini_(buildPrompt_(metrics), { temperature: 0.4 });
      return ResponseHandler.success(reviewedDraft_('biometric.dashboard-insight', {
        model: model_(),
        metrics: metrics,
        insight: String(insight || '').trim()
      }));
    } catch (err) {
      return ResponseHandler.error(err, 'AIService.generateInsights');
    }
  }

  function buildPrompt_(metrics) {
    return [
      'Você é um coordenador pedagógico analisando o painel de um sistema de',
      'neuro-educação para os anos iniciais. Use SOMENTE os números agregados',
      'abaixo (são contagens da turma/escola, sem dados individuais):',
      '',
      JSON.stringify(metrics),
      '',
      'Escreva de 3 a 4 frases, em português do Brasil, com tom acolhedor e',
      'profissional, destacando: (1) o panorama geral de uso; (2) algum ponto de',
      'atenção operacional (ex.: alertas pendentes ou críticos, sensores offline);',
      '(3) uma sugestão prática de próximo passo. Não invente dados além dos',
      'fornecidos e não faça diagnósticos sobre crianças específicas.'
    ].join('\n');
  }

  /** Ponto único de HTTP com o Gemini, já resiliente. */
  function callGemini_(prompt, generationConfig) {
    try {
      var key = getApiKey_();
      if (!key) throw new Error('Chave GEMINI_API_KEY não configurada.');

      var url = BASE_URL + encodeURIComponent(model_()) +
        ':generateContent?key=' + encodeURIComponent(key);

      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: generationConfig || {}
        }),
        muteHttpExceptions: true
      };

      var resp = fetchWithRetry_(url, options);
      var code = resp.getResponseCode();
      if (code !== 200) {
        throw new Error('Falha ao consultar a IA (HTTP ' + code + ').');
      }

      var json = safeParse_(resp.getContentText());
      // FROTA-XX: extração defensiva com GeminiResponseNormalizer
      var text = GeminiResponseNormalizer.extractText(json);
      if (!text) throw new Error('A IA não retornou um texto utilizável.');
      return text;
    } catch (error) {
      Logger.log("Erro em callGemini_: " + error.message);
      throw error;
    }
  }

  /**
   * Repete a chamada em falhas transitórias do Gemini (HTTP 429/500/503 e
   * exceções de rede) com backoff exponencial. As opções mantêm
   * muteHttpExceptions:true.
   */
  function fetchWithRetry_(url, options) {
    var MAX = 3;
    var waitMs = 700;
    for (var attempt = 1; attempt <= MAX; attempt++) {
      try {
        var resp = UrlFetchApp.fetch(url, options);
        var code = resp.getResponseCode();
        if ((code === 429 || code === 500 || code === 503) && attempt < MAX) {
          Utilities.sleep(waitMs);
          waitMs *= 2;
          continue;
        }
        return resp;
      } catch (e) {
        if (attempt >= MAX) throw e;
        Utilities.sleep(waitMs);
        waitMs *= 2;
      }
    }
  }

  /** JSON.parse com erro claro em vez do SyntaxError cru. */
  function safeParse_(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Resposta da API Gemini não veio em JSON válido: ' +
        String(text == null ? '' : text).slice(0, 200));
    }
  }

  /** Prompt do perfil multimodal de foco/esforço de UMA sessão (não-rotulante). */
  function buildFocusPrompt_(sinais) {
    try {
      try {
        return [
          'Você é professor(a) dos anos iniciais acompanhando, COM CONSENTIMENTO, uma única tarefa de um estudante,',
          'com dispositivos de consumo (Muse 2/EEG, Galaxy Watch 5/FC-VFC, Tobii 5/olhar).',
          'Sinais MOMENTÂNEOS desta sessão (não são diagnóstico nem rótulo):',
          '',
          JSON.stringify(sinais),
          '',
          'Descreva, em 3 a 4 frases (português do Brasil), o ESTADO momentâneo de foco e esforço durante a tarefa',
          'e indique quando convém um andaime ou uma pausa. Regras: trate como ESTADO da sessão (não traço fixo da',
          'criança), sem diagnóstico (TDAH, dislexia etc.), sem comparação com outras crianças; marque incertezas.'
        ].join('\n');
      } catch (error) {
        Logger.log("Erro em buildFocusPrompt_: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em buildFocusPrompt_: " + error.message);
      throw error;
    }
  }

  // ─── Proposta #55 — Padrão de leitura ocular para mediação de fluência ──────

  /**
   * Agrega as amostras POG (e opcionalmente EEG) de uma sessão em métricas
   * estatísticas relevantes para análise de fluência de leitura.
   * @param {Array} pogArr  Amostras de DadosPOG da sessão.
   * @param {Array} eegArr  Amostras de DadosEEG da sessão (opcional).
   * @return {Object}
   */
  function aggregateReadingMetrics_(pogArr, eegArr) {
    pogArr = pogArr || [];
    eegArr = eegArr || [];

    function avg(arr, key) {
      try {
        var vals = arr.map(function(r) { return Number(r[key]); }).filter(isFinite);
        return vals.length ? vals.reduce(function(a, b) { return a + b; }, 0) / vals.length : null;
      } catch (error) {
        Logger.log("Erro em avg: " + error.message);
        throw error;
      }
    }
    function sum(arr, key) {
      try {
        return arr.map(function(r) { return Number(r[key]); }).filter(isFinite).reduce(function(a, b) { return a + b; }, 0);
      } catch (error) {
        Logger.log("Erro em sum: " + error.message);
        throw error;
      }
    }
    function max(arr, key) {
      try {
        var vals = arr.map(function(r) { return Number(r[key]); }).filter(isFinite);
        return vals.length ? Math.max.apply(null, vals) : null;
      } catch (error) {
        Logger.log("Erro em max: " + error.message);
        throw error;
      }
    }

    // Distribuição de fixações: curtas (<150ms), médias (150–400ms), longas (>400ms)
    var fixDurs = pogArr.map(function(r) { return Number(r.fixation_duration_ms); }).filter(isFinite);
    var fixShort  = fixDurs.filter(function(v) { return v < 150; }).length;
    var fixMid    = fixDurs.filter(function(v) { return v >= 150 && v <= 400; }).length;
    var fixLong   = fixDurs.filter(function(v) { return v > 400; }).length;

    return {
      amostras_pog: pogArr.length,
      amostras_eeg: eegArr.length,
      fixacao_duracao_media_ms: avg(pogArr, 'fixation_duration_ms'),
      fixacao_duracao_max_ms:   max(pogArr, 'fixation_duration_ms'),
      distribuicao_fixacoes: { curtas_menor_150ms: fixShort, medias_150_400ms: fixMid, longas_maior_400ms: fixLong },
      regressoes_total:         sum(pogArr, 'regressions_count'),
      regressoes_media_por_amostra: avg(pogArr, 'regressions_count'),
      saccade_velocity_media:   avg(pogArr, 'saccade_velocity'),
      eeg_teta_alfa_media:      avg(eegArr, 'theta_alpha_ratio'),
      eeg_teta_alfa_max:        max(eegArr, 'theta_alpha_ratio')
    };
  }

  /**
   * Monta o prompt para análise do padrão de leitura — descritivo e não-diagnóstico.
   */
  function buildReadingPrompt_(metricas) {
    try {
      try {
        return [
          'Você é um(a) professor(a) dos anos iniciais acompanhando uma atividade de leitura,',
          'COM CONSENTIMENTO, com um rastreador ocular Tobii Eye Tracker 5.',
          '',
          'Métricas de movimentos oculares DESTA SESSÃO (não são diagnóstico nem rótulo):',
          JSON.stringify(metricas),
          '',
          'GLOSSÁRIO rápido para contextualizar:',
          '- fixation_duration_ms: tempo que o olhar "pousou" em cada ponto do texto.',
          '  Fixações muito curtas podem indicar leitura rápida ou superficial;',
          '  fixações muito longas podem indicar dificuldade de decodificação.',
          '- regressions_count: movimentos oculares de volta a palavras já lidas.',
          '  Regressões frequentes podem indicar necessidade de releitura ou dificuldade de compreensão.',
          '- saccade_velocity: velocidade dos saltos entre pontos de fixação.',
          '',
          'Responda em português do Brasil com 4 a 5 frases, tom pedagógico e acolhedor:',
          '1. Descreva o PADRÃO MOMENTÂNEO de leitura observado nesta sessão.',
          '2. Aponte o que as métricas sugerem sobre o processo de leitura (sem rotular a criança).',
          '3. Sugira 2 estratégias concretas de mediação de fluência ou andaime que o(a) professor(a)',
          '   pode experimentar (ex.: leitura em voz alta compartilhada, marcação de palavras-chave,',
          '   uso de régua de leitura, releitura de trecho, etc.).',
          '4. Marque explicitamente as incertezas: o que NÃO é possível concluir apenas com esses dados.',
          '',
          'RESTRIÇÕES ABSOLUTAS:',
          '- NÃO diagnostique dislexia, transtorno de leitura, TDAH nem nenhuma condição clínica.',
          '- NÃO rotule a criança nem compare com outras.',
          '- Trate como ESTADO desta sessão, não como traço permanente.',
          '- Se as amostras forem poucas (< 10), mencione que os dados são insuficientes para',
          '  padrões confiáveis e sugira repetir a atividade com mais tempo de coleta.'
        ].join('\n');
      } catch (error) {
        Logger.log("Erro em buildReadingPrompt_: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em buildReadingPrompt_: " + error.message);
      throw error;
    }
  }

  /**
   * Gera perfil de foco/esforço momentâneo a partir dos sinais biométricos de UMA sessão.
   * Descritivo e não-rotulante — NÃO diagnostica TDAH, dislexia nem condição clínica.
   *
   * @param {Object} payload  {sinais: Object, sessionId?, studentId?, token}
   * @param {Object} session  Sessão validada.
   * @return {Object}  ResponseHandler envelope com {model, sinais, insight}.
   */
  function generateFocusProfile(payload, session) {
    var consentFailure = requireGenerativeConsent_(payload);
    if (consentFailure) return consentFailure;
    if (!isConfigured()) {
      return ResponseHandler.error(
        'Análise por IA indisponível: configure a chave GEMINI_API_KEY nas propriedades do script.'
      );
    }
    var sinais = (payload && payload.sinais) || {};
    try {
      var insight = callGemini_(buildFocusPrompt_(sinais), { temperature: 0.4 });
      return ResponseHandler.success(reviewedDraft_('biometric.focus-profile', {
        model: model_(),
        sinais: sinais,
        insight: String(insight || '').trim()
      }));
    } catch (err) {
      return ResponseHandler.error(err, 'AIService.generateFocusProfile');
    }
  }

  /**
   * Proposta #55 — Padrão de leitura ocular para mediação de fluência (Tobii 5).
   *
   * Durante uma atividade de leitura, lê fixações e regressões da sessão via
   * BiometricDataController (modalidade POG + EEG opcional), agrega métricas e
   * pede ao Gemini uma descrição do padrão momentâneo + sugestões de mediação
   * de fluência. Descritivo e preliminar — NÃO diagnostica dislexia nem
   * transtorno de leitura; não rotula a criança.
   *
   * @param {Object} payload  {sessionId, studentId?, token}
   * @param {Object} session  Sessão validada.
   * @return {Object}  ResponseHandler envelope com {model, metricas, insight}.
   */
  function generateReadingPattern(payload, session) {
    var consentFailure = requireGenerativeConsent_(payload);
    if (consentFailure) return consentFailure;
    if (!isConfigured()) {
      return ResponseHandler.error(
        'Análise por IA indisponível: configure a chave GEMINI_API_KEY nas propriedades do script.'
      );
    }

    // Busca POG (obrigatório) + EEG (complementar para theta_alpha)
    var bioPog = BiometricDataController.query(
      { sessionId: payload.sessionId, studentId: payload.studentId, modalidade: 'POG' },
      session
    );
    if (!ResponseHandler.isSuccess(bioPog)) return bioPog;

    var bioEeg = BiometricDataController.query(
      { sessionId: payload.sessionId, studentId: payload.studentId, modalidade: 'EEG' },
      session
    );
    var pogData = (ResponseHandler.dataOf(bioPog, {}) || {}).pog || [];
    var eegData = ResponseHandler.isSuccess(bioEeg)
      ? ((ResponseHandler.dataOf(bioEeg, {}) || {}).eeg || [])
      : [];

    var metricas = aggregateReadingMetrics_(pogData, eegData);

    try {
      var insight = callGemini_(buildReadingPrompt_(metricas), { temperature: 0.4 });
      return ResponseHandler.success(reviewedDraft_('biometric.reading-pattern', {
        model: model_(),
        metricas: metricas,
        insight: String(insight || '').trim()
      }));
    } catch (err) {
      return ResponseHandler.error(err, 'AIService.generateReadingPattern');
    }
  }

  return {
    isConfigured: isConfigured,
    generateInsights: generateInsights,
    generateFocusProfile: generateFocusProfile,
    generateReadingPattern: generateReadingPattern
  };
})();
