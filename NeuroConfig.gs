/**
 * @file NeuroConfig.gs
 * @description Limiares neurofisiologicos personalizados por perfil escolar.
 */
var NeuroConfig = (function() {
  var THRESHOLDS = {
    EARLY_YEARS: {
      label: 'anos iniciais',
      grades: ['1', '2', '3'],
      ageRange: { min: 6, max: 8 },
      EEG_THETA_ALPHA_MAX: 2.8,
      HRV_MIN: 18,
      EDA_PEAKS_PER_MIN: 7,
      POG_REGRESSION_MAX: 6,
      COMBINED_MODALITY_ALERT_MIN: 3
    },
    CONSOLIDATION_YEARS: {
      label: 'consolidacao leitora',
      grades: ['4', '5'],
      ageRange: { min: 9, max: 11 },
      EEG_THETA_ALPHA_MAX: 2.5,
      HRV_MIN: 20,
      EDA_PEAKS_PER_MIN: 6,
      POG_REGRESSION_MAX: 5,
      COMBINED_MODALITY_ALERT_MIN: 3
    },
    TRANSITION_YEARS: {
      label: 'transicao escolar',
      grades: ['6', '7'],
      ageRange: { min: 12, max: 13 },
      EEG_THETA_ALPHA_MAX: 2.3,
      HRV_MIN: 22,
      EDA_PEAKS_PER_MIN: 5,
      POG_REGRESSION_MAX: 4,
      COMBINED_MODALITY_ALERT_MIN: 3
    }
  };

  var REQUIRED_KEYS = [
    'EEG_THETA_ALPHA_MAX',
    'HRV_MIN',
    'EDA_PEAKS_PER_MIN',
    'POG_REGRESSION_MAX',
    'COMBINED_MODALITY_ALERT_MIN'
  ];

  var CROSS_SENSOR_SCORE = {
    threshold: 4,
    weights: {
      EEG_OVERLOAD: 3,
      ECG_STRESS: 2,
      EDA_ANXIETY: 1,
      POG_READING_DIFFICULTY: 1
    }
  };

  function calculateAge_(dateValue) {
    if (!dateValue) return null;
    var birthDate = new Date(dateValue);
    if (isNaN(birthDate.getTime())) return null;
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var birthdayPassed = today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    return birthdayPassed ? age : age - 1;
  }

  function normalizeGrade_(value) {
    try {
      if (value === null || typeof value === 'undefined') return '';
      var match = String(value).match(/\d+/);
      return match ? match[0] : '';
    } catch (error) {
      Logger.log("Erro em normalizeGrade_: " + error.message);
      throw error;
    }
  }

  function resolveProfileKey(student) {
    try {
      var grade = normalizeGrade_(student && (student.serie || student.Serie || student.Class || student.class));
      var age = calculateAge_(student && (student.data_nascimento || student.dataNascimento || student.birthDate));
      var profileKeys = Object.keys(THRESHOLDS);

      for (var i = 0; i < profileKeys.length; i++) {
        var key = profileKeys[i];
        if (grade && THRESHOLDS[key].grades.indexOf(grade) >= 0) return key;
      }

      for (var j = 0; j < profileKeys.length; j++) {
        var profile = THRESHOLDS[profileKeys[j]];
        if (age !== null && age >= profile.ageRange.min && age <= profile.ageRange.max) return profileKeys[j];
      }

      return null;
    } catch (error) {
      Logger.log("Erro em resolveProfileKey: " + error.message);
      throw error;
    }
  }

  function validateThresholdProfile(profileKey) {
    try {
      var profile = profileKey ? THRESHOLDS[profileKey] : null;
      var invalidKeys = [];
      if (!profile) return StandardReturn.fail(Constants.ERROR_MESSAGES.missingStudentThresholdProfile(profileKey || 'indefinido'));

      REQUIRED_KEYS.forEach(function(key) {
        var value = Number(profile[key]);
        if (profile[key] === undefined || profile[key] === null || !isFinite(value)) invalidKeys.push(key);
      });

      if (invalidKeys.length > 0) {
        return StandardReturn.fail(Constants.ERROR_MESSAGES.invalidAlertThresholds(invalidKeys));
      }

      return StandardReturn.ok({
        profileKey: profileKey,
        label: profile.label,
        EEG_THETA_ALPHA_MAX: Number(profile.EEG_THETA_ALPHA_MAX),
        HRV_MIN: Number(profile.HRV_MIN),
        EDA_PEAKS_PER_MIN: Number(profile.EDA_PEAKS_PER_MIN),
        POG_REGRESSION_MAX: Number(profile.POG_REGRESSION_MAX),
        COMBINED_MODALITY_ALERT_MIN: Number(profile.COMBINED_MODALITY_ALERT_MIN)
      });
    } catch (error) {
      Logger.log("Erro em validateThresholdProfile: " + error.message);
      throw error;
    }
  }

  function getThresholdsForStudent(student) {
    return validateThresholdProfile(resolveProfileKey(student));
  }

  return {
    THRESHOLDS: THRESHOLDS,
    CROSS_SENSOR_SCORE: CROSS_SENSOR_SCORE,
    REQUIRED_KEYS: REQUIRED_KEYS,
    resolveProfileKey: resolveProfileKey,
    validateThresholdProfile: validateThresholdProfile,
    getThresholdsForStudent: getThresholdsForStudent
  };
})();
