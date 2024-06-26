import { deviceRooms, rgbModels } from '../util';

class GoveeConfig {
  credentials = { username: null, password: null };

  goveeComponents = null;

  ttrScenes = [];

  apiProvider = null;

  devices = {};

  scenes = [];

  constructor(apiProvider) {
    this.apiProvider = apiProvider;
  }

  getToken(credentials) {
    this.credentials = credentials;
    return this.apiProvider.gvGetToken(credentials.username, credentials.password);
  }

  async getTTRs() {
    if (!this.apiProvider) {
      console.warn('[Govee][getTTRs] no api provider');
      return null;
    }
    console.log('[Govee] gettings TTRs...');
    const components = await this.apiProvider.gvGetScenes(this.credentials.username, this.credentials.password);
    this.parseTTRs(components);
    console.log('[Govee] ttrs: ', this.ttrScenes);
    return this.ttrScenes;
  }

  parseTTRs(goveeComponents) {
    this.goveeComponents = goveeComponents;
    this.ttrScenes = [];
    goveeComponents.forEach((ttr) => {
      if (ttr.oneClicks) {
        ttr.oneClicks.forEach((oneClick) => {
          if (oneClick.iotRules) {
            oneClick.iotRules.forEach((iotRule) => {
              if (iotRule?.deviceObj?.sku) {
                if (rgbModels.includes(iotRule.deviceObj.sku)) {
                  iotRule.rule.forEach((rule) => {
                    if (rule.iotMsg) {
                      const iotMsg = JSON.parse(rule.iotMsg);
                      const cmdVal = JSON.parse(rule.cmdVal);
                      if (['ptReal', 'ptUrl'].includes(iotMsg.msg?.cmd)) {
                        const deviceName = iotRule.deviceObj.name;
                        const ttrName = oneClick.name;
                        const diyName = cmdVal?.diyName;

                        let code = null;
                        let codeArray = [];

                        switch (iotMsg.msg.cmd) {
                          case 'ptUrl':
                            codeArray = iotMsg.msg.data.value;
                            code = `ptUrl.${codeArray.join(',')}`;
                            break;
                          case 'ptReal':
                            codeArray = iotMsg.msg.data.command;
                            code = codeArray.join(',');
                            break;
                          default:
                            code = '';
                            break;
                        }
                        const room = deviceRooms[deviceName] || 'living_room';
                        this.ttrScenes.push({
                          deviceName, ttrName, code, diyName, room,
                        });
                      }
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
    this.setGoveeDevices();
    this.setGoveeScenes();
  }

  setGoveeDevices() {
    const devices = {};
    this.ttrScenes.forEach(({
      deviceName, ttrName, code, diyName, room,
    }) => {
      if (!devices[deviceName]) {
        devices[deviceName] = {
          name: deviceName,
          scenes: { [ttrName]: code },
          room,
        };
      } else {
        devices[deviceName].scenes[ttrName] = code;
      }
    });
    this.devices = devices;
  }

  setGoveeScenes() {
    const scenes = [];
    this.ttrScenes.forEach(({
      deviceName, ttrName, code, diyName, room,
    }) => {
      if (!scenes[ttrName]) {
        scenes[ttrName] = { name: ttrName, devices: { [deviceName]: { code, diyName } }, rooms: [] };
      } else {
        scenes[ttrName].devices[deviceName] = { code, diyName };
      }
      if (!scenes[ttrName].rooms.includes(room)) {
        scenes[ttrName].rooms.push(room);
      }
    });
    this.scenes = scenes;
  }

  getGoveeRoomScenes(room) {
    return Object.keys(this.scenes || []).reduce((acc, s) => {
      if (this.scenes[s].rooms.includes(room)) {
        acc[s] = this.scenes[s];
      }
      return acc;
    }, {});
  }
}

export default GoveeConfig;
