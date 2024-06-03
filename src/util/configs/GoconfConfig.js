import { defaultSlots, rooms } from '../util';

class GoconfConfig {
  scenesJson = null;

  sceneSlots = [];

  apiProvider = null;

  constructor(apiProvider) {
    this.apiProvider = apiProvider;
  }

  getRoomSlots(room) {
    console.log('get room slots', room, this.sceneSlots);
    return this.sceneSlots.filter((ss) => ss.room === room);
  }

  async reload() {
    const result = await this.apiProvider.apiGetScenes();
    const { data: scenesJson } = result;
    this.scenesJson = scenesJson;
    this.sceneSlots = [...scenesJson];
    return scenesJson;
  }

  setSceneSlots(slots) {
    this.sceneSlots = slots;
  }

  reconstruct(scenesJson, hbDevices) {
    this.sceneSlots = rooms.reduce((acc, r) => {
      const roomSlots = defaultSlots.map((slot) => {
        const sceneSlot = this.scenesJson.find((ss) => ss.slot === slot && ss.room === r.key);
        if (!sceneSlot) {
          return {
            slot,
            room: r.key,
            scene: null,
            lights: [],
          };
        }
        return { room: r.key, lights: [], ...sceneSlot };
      });
      acc.push(...roomSlots);
      return acc;
    }, []).reduce((acc, data) => {
      const slotData = { ...data };
      slotData.devices = [];
      Object.keys(hbDevices).forEach((deviceName) => {
        const deviceSlot = hbDevices.configDevices[deviceName].slots[slotData.slot];
        if (deviceSlot && slotData.room === deviceSlot.room) {
          slotData.devices.push({
            device: deviceName,
            code: deviceSlot.sceneCode,
            diyName: deviceSlot.diyName,
          });
        }
      });
      acc.push(slotData);
      return acc;
    }, []);
  }
}

export default GoconfConfig;
