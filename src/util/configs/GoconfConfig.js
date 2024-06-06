import { defaultSlots, rooms } from '../util';

class GoconfConfig {
  scenesJson = null;

  sceneSlots = [];

  apiProvider = null;

  constructor(apiProvider) {
    this.apiProvider = apiProvider;
  }

  getRoomSlots(room) {
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

  async reconstruct(hbDevices) {
    const { data: scenesJson } = await this.apiProvider.apiGetScenes();
    this.scenesJson = scenesJson;
    this.sceneSlots = rooms.reduce((acc, r) => {
      const roomSlots = defaultSlots.map((slot) => {
        const sceneSlot = this.scenesJson.find((ss) => ss.slot === slot && ss.room === r.key);
        if (!sceneSlot) {
          return {
            slot,
            room: r.key,
            scene: null,
            lights: [],
            imagePath: null,
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
        const deviceSlot = hbDevices[deviceName].slots[slotData.slot];
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

  async updateScene(sceneSlot) {
    console.log('[Goconf] Updating sceneSlot', sceneSlot);
    const index = this.sceneSlots.findIndex((ss) => ss.room === sceneSlot.room && ss.slot === sceneSlot.slot);
    if (index !== -1) {
      console.log('[Goconf] saving scene slots...');
      this.sceneSlots[index] = { ...sceneSlot };
      await this.apiProvider.apiSaveScenes(this.sceneSlots);
      this.scenesJson = this.sceneSlots;
    } else {
      console.log('[Goconf] scene slot not found!', this.sceneSlots);
    }
  }
}

export default GoconfConfig;
