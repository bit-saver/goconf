import { defaultSlots, deviceRooms } from '../util';

class HomebridgeConfig {
  pluginConfig = null;

  goconf = null;

  apiProvider = null;

  devices = {};

  scenes = {};

  constructor(apiProvider, goconf) {
    this.apiProvider = apiProvider;
    this.goconf = goconf;
  }

  get goveeCredentials() {
    if (!this.pluginConfig) {
      return { username: null, password: null };
    }
    return { username: this.pluginConfig.username, password: this.pluginConfig.password };
  }

  async loadConfig() {
    try {
      this.pluginConfig = await this.apiProvider.apiGet('/api/config-editor/plugin/homebridge-govee')
        .then((result) => {
          if (result?.data) {
            return result.data[0];
          } else {
            throw new Error('Homebridge plugin config returned null');
          }
        });
    } catch (err) {
      this.pluginConfig = null;
      console.error('[HB] Error loading homebridge config', err);
      throw err;
    }
  }

  setGoconfScenes() {
    this.setScenesAndDevices();
  }

  async updateConfig(deviceUpdates, slot, sceneData) {
    console.log('[HB] update config: device updates', deviceUpdates, 'slot', slot, 'sceneData', sceneData);
    const { lightDevices } = this.pluginConfig;
    deviceUpdates.forEach(({ name: deviceName }) => {
      const index = lightDevices.findIndex((light) => light.label === deviceName);
      if (index >= 0) {
        lightDevices[index][slot] = {
          sceneCode: sceneData.devices[deviceName].code,
          showAs: 'switch',
        };
      }
    });

    this.pluginConfig = { ...this.pluginConfig, lightDevices };
    this.setScenesAndDevices();
    console.log('[HB] config updated', this.pluginConfig);
    await this.saveConfig();
  }

  async saveConfig(config = null) {
    if (config) {
      this.pluginConfig = config;
    }
    await this.apiProvider.apiPost('/api/config-editor/plugin/homebridge-govee', [this.pluginConfig]);
    console.log('[HB] config saved', this.pluginConfig);
  }

  setScenesAndDevices() {
    const slotsNullObjects = defaultSlots.reduce((acc, slotName) => {
      acc[slotName] = null;
      return acc;
    }, {});

    const slotsEmptyObjects = defaultSlots.reduce(
      (slotScenes, slot) => ({ ...slotScenes, [slot]: {} }),
      {},
    );

    [this.devices, this.scenes] = this.pluginConfig.lightDevices.reduce((acc, lightDevice) => {
      const deviceName = lightDevice.label;
      acc[0][deviceName] = {
        id: lightDevice.deviceId,
        slots: { ...slotsNullObjects },
      };

      const deviceRoom = deviceRooms[deviceName] || 'living_room';

      defaultSlots.forEach((slotName) => {
        if (lightDevice[slotName]) {
          const sceneCode = (lightDevice[slotName]?.sceneCode ? lightDevice[slotName].sceneCode.trim() : null);
          let sceneName = null;
          let diyName = null;

          const goconfScene = this.goconf.sceneSlots.find(
            (ss) => ss.room === deviceRoom && ss.slot === slotName && ss.devices.find(
              (ssd) => ssd.device === deviceName,
            ),
          );
          if (goconfScene) {
            const goconfSceneDevice = goconfScene.devices.find((ssd) => ssd.device === deviceName);
            if (goconfSceneDevice && goconfSceneDevice.code) {
              sceneName = goconfScene.scene;
              diyName = goconfSceneDevice.diyName;
            }
          }

          acc[0][deviceName].slots[slotName] = {
            sceneName,
            diyName,
            sceneCode,
            room: deviceRoom,
          };
          if (!acc[1][slotName][sceneName]) {
            acc[1][slotName][sceneName] = [];
          }
          acc[1][slotName][sceneName].push(lightDevice.label);
        }
      });
      return acc;
    }, [{}, slotsEmptyObjects]);
  }
}

export default HomebridgeConfig;
