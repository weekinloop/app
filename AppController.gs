/**
 * @file AppController.gs
 * @description Registro/fabrica central para modulos App_* do NeuroEdu.
 */

var AppController = (function() {
  var _registry = {};

  function register(key, name, handlers) {
    if (!key || !name || !handlers) {
      return StandardReturn.fail('AppController.register requer key, name e handlers.');
    }
    if (typeof handlers.getIndicators !== 'function' || typeof handlers.saveRecord !== 'function') {
      return StandardReturn.fail('Aplicacao sem handlers obrigatorios: ' + key);
    }
    _registry[key] = {
      key: key,
      name: name,
      saveRecord: handlers.saveRecord,
      getRecords: handlers.getRecords,
      getIndicators: handlers.getIndicators
    };
    return StandardReturn.ok(_registry[key]);
  }

  function registerLegacy_(key, name, controller) {
    if (_registry[key] || !controller) return;
    register(key, name, {
      saveRecord: controller.saveRecord,
      getRecords: controller.getRecords,
      getIndicators: controller.getIndicators
    });
  }

  function ensureLegacyRegistrations_() {
    registerLegacy_('reading', 'Fluência de Leitura', typeof App_ReadingFluency_ !== 'undefined' ? App_ReadingFluency_ : null);
    registerLegacy_('math', 'Ansiedade Matemática', typeof App_MathAnxiety_ !== 'undefined' ? App_MathAnxiety_ : null);
    registerLegacy_('adhd', 'Autorregulação TDAH', typeof App_ADHDRegulation_ !== 'undefined' ? App_ADHDRegulation_ : null);
    registerLegacy_('science', 'Laboratório de Ciências', typeof App_ScienceLab_ !== 'undefined' ? App_ScienceLab_ : null);
    registerLegacy_('aac', 'Comunicação Aumentativa', typeof App_AACNonVerbal_ !== 'undefined' ? App_AACNonVerbal_ : null);
    registerLegacy_('gamification', 'Engajamento em Gamificação', typeof App_GamificationEngagement_ !== 'undefined' ? App_GamificationEngagement_ : null);
    registerLegacy_('physicalEd', 'Educação Física', typeof App_PhysicalEd_ !== 'undefined' ? App_PhysicalEd_ : null);
    registerLegacy_('reaction', 'Jogos de Reação', typeof App_ReactionGames_ !== 'undefined' ? App_ReactionGames_ : null);
    registerLegacy_('dyslexia', 'Foco Visual e Dislexia', typeof App_DyslexiaFocus_ !== 'undefined' ? App_DyslexiaFocus_ : null);
    registerLegacy_('memory', 'Memória de Trabalho', typeof App_WorkingMemory_ !== 'undefined' ? App_WorkingMemory_ : null);
    registerLegacy_('mindfulness', 'Mindfulness', typeof App_Mindfulness_ !== 'undefined' ? App_Mindfulness_ : null);
    registerLegacy_('ahaMoments', 'Momentos Eureka', typeof App_AhaMoments_ !== 'undefined' ? App_AhaMoments_ : null);
    registerLegacy_('ergonomics', 'Ergonomia', typeof App_Ergonomics_ !== 'undefined' ? App_Ergonomics_ : null);
    registerLegacy_('studyPatterns', 'Padrões de Estudo', typeof App_StudyPatterns_ !== 'undefined' ? App_StudyPatterns_ : null);
    registerLegacy_('distraction', 'Microdistrações', typeof App_DistractionMicroMoments_ !== 'undefined' ? App_DistractionMicroMoments_ : null);
    registerLegacy_('methodology', 'Impacto de Metodologias', typeof App_MethodologyImpact_ !== 'undefined' ? App_MethodologyImpact_ : null);
    registerLegacy_('creative', 'Escrita Criativa', typeof App_CreativeWriting_ !== 'undefined' ? App_CreativeWriting_ : null);
    registerLegacy_('artistic', 'Retorno Artístico', typeof App_ArtisticFeedback_ !== 'undefined' ? App_ArtisticFeedback_ : null);
    registerLegacy_('preferences', 'Preferências de Aprendizado', typeof App_LearningPreferences_ !== 'undefined' ? App_LearningPreferences_ : null);
    registerLegacy_('stem', 'Esforço STEM', typeof App_STEMEffort_ !== 'undefined' ? App_STEMEffort_ : null);
    registerLegacy_('leadership', 'Estilos de Liderança', typeof App_LeadershipStyles_ !== 'undefined' ? App_LeadershipStyles_ : null);
    registerLegacy_('music', 'Musicoterapia', typeof App_MusicTherapy_ !== 'undefined' ? App_MusicTherapy_ : null);
    registerLegacy_('resilience', 'Resiliência Pós-erro', typeof App_PostErrorResilience_ !== 'undefined' ? App_PostErrorResilience_ : null);
  }

  function get(key) {
    ensureLegacyRegistrations_();
    return _registry[key] || null;
  }

  function resolveModules(keys) {
    try {
      ensureLegacyRegistrations_();
      var modules = [];
      (keys || []).forEach(function(key) {
        var module = get(key);
        if (module) modules.push(module);
      });
      return modules;
    } catch (error) {
      Logger.log("Erro em resolveModules: " + error.message);
      throw error;
    }
  }

  function getApplicationModules(application) {
    var groups = {
      reading: ['reading'],
      math: ['math'],
      adhd: ['adhd'],
      science: ['science'],
      aac: ['aac'],
      gamification: ['gamification', 'reaction'],
      physicalEd: ['physicalEd'],
      dyslexia: ['dyslexia'],
      memory: ['memory'],
      mindfulness: ['mindfulness'],
      ahaMoments: ['ahaMoments'],
      ergonomics: ['ergonomics'],
      studyPatterns: ['studyPatterns', 'distraction'],
      methodologies: ['methodology'],
      arts: ['creative', 'artistic'],
      preferences: ['preferences'],
      stem: ['stem', 'leadership'],
      resilience: ['music', 'resilience']
    };
    if (!groups[application]) return null;
    return resolveModules(groups[application]);
  }

  return {
    register: register,
    get: get,
    getApplicationModules: getApplicationModules,
    resolveModules: resolveModules
  };
})();
