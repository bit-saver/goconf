import { defaultSlots, deviceRooms } from '../util';

class HomebridgeConfig {
  pluginConfig = null;

  goconfScenes = [];

  devices = {};

  scenes = {};

  constructor(pluginConfig, goconfScenes = []) {
    this.pluginConfig = pluginConfig;
    this.goconfScenes = goconfScenes;
    this.setScenesAndDevices();
  }

  setGoconfScenes(scenes) {
    this.goconfScenes = scenes;
  }

  updateConfig(deviceUpdates, slot, sceneData) {
    const { lightDevices } = this.pluginConfig;
    deviceUpdates.forEach(({ name: deviceName }) => {
      const index = lightDevices.findIndex((light) => light.label === deviceName);
      if (index >= 0) {
        lightDevices[index][slot] = {
          sceneCode: sceneData.devices[deviceName],
          showAs: 'switch',
        };
      }
    });

    this.pluginConfig = { ...this.pluginConfig, lightDevices };
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
          const sceneCode = lightDevice[slotName].sceneCode.trim();
          let sceneName = null;
          let diyName = null;

          const goconfScene = this.goconfScenes.find(
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
