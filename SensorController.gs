/**
 * @file       SensorController.gs
 * @project    NeuroEdu — Sistema de Neuro-educação Personalizada
 * @version    1.0.0
 * @author     Equipe NeuroEdu
 * @date       2026-06-05
 *
 * @summary
 *   Controlador de registro, consulta e calibração dos biossensores:
 *   Muse 2 (EEG), Samsung Galaxy Watch 5 (ECG/EDA) e Tobii Eye Tracker 5 (POG).
 *
 * @description
 *   Cada dispositivo físico é registrado no sistema com seu identificador
 *   único (MAC address ou número de série), tipo de sensor, estudante ao
 *   qual está atribuído e status de calibração. O sistema verifica o status
 *   dos sensores antes de iniciar uma sessão biométrica e alerta o professor
 *   caso algum dispositivo não esteja calibrado ou offline.
 *
 * @integrations
 *   Code.gs              : Rotas registerSensor, getSensors
 *   Database.gs          : appendRow(), getAll(), updateById()
 *   Config.gs            : SHEET_NAMES.SENSORS
 *   SessionController.gs : Verifica status dos sensores antes de iniciar sessão
 *   BiometricDataController.gs : Associa dados ao sensor que os coletou
 *   SensorsView.html     : Interface de status e calibração dos sensores
 *   notebook.py          : Envia identificador do sensor em cada payload
 *
 * @sensorTypes
 *   EEG  : Muse 2 (eletrodos AF7, AF8, TP9, TP10)
 *   ECG  : Samsung Galaxy Watch 5 (biossensor ativo no pulso)
 *   EDA  : Samsung Galaxy Watch 5 (sensor BioActive)
 *   POG  : Tobii Eye Tracker 5 (90Hz, acoplado ao monitor)
 *
 * @sheetColumns (aba Sensores)
 *   id | tipo | identificador | estudante_id | status | ultima_calibracao |
 *   firmware_version | ativo | created_at | updated_at
 */

var SensorController = (function() {

  function register(payload, session) {
    try {
      var tipo = payload.tipo;
      var tiposValidos = ['EEG', 'ECG', 'EDA', 'POG'];
      if (tiposValidos.indexOf(tipo) === -1) {
        return ResponseHandler.error('Tipo de sensor inválido. Use: ' + tiposValidos.join(', '));
      }

      var id = Database.appendRow(Config.SHEET_NAMES.SENSORS, [
        tipo,
        payload.identificador || '',
        payload.estudanteId || '',
        'online',
        new Date().toISOString(),
        payload.firmwareVersion || '',
        true
      ]);
      return ResponseHandler.success({ sensorId: id });
    } catch (err) {
      return ResponseHandler.error(err, 'SensorController.register');
    }
  }

  function list(payload, session) {
    try {
      try {
        var filters = { ativo: true };
        if (payload.estudanteId) filters.estudante_id = payload.estudanteId;
        if (payload.tipo)        filters.tipo         = payload.tipo;
        var sensors = Database.getAll(Config.SHEET_NAMES.SENSORS, filters);
        return ResponseHandler.success(sensors);
      } catch (err) {
        return ResponseHandler.error(err, 'SensorController.list');
      }
    } catch (error) {
      Logger.log("Erro em list: " + error.message);
      throw error;
    }
  }

  function updateStatus(sensorId, status) {
    return Database.updateById(Config.SHEET_NAMES.SENSORS, sensorId, { status: status });
  }

  return { register: register, list: list, updateStatus: updateStatus };

})();

// Legacy alias kept for gradual migration of older calls.
var SensorController_ = SensorController;
