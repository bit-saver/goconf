import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import ApiContext from './ApiContext';
import {
  asyncTimeout, defaultSlots, deviceRooms, rgbModels, rooms,
} from './util';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const {
    apiGet, apiPut, apiGetScenes, gvGetToken, gvGetScenes, token,
  } = useContext(ApiContext);
  const [goveeConfig, setGoveeConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [sceneSlots, setSceneSlots] = useState([]);
  const [room, setRoom] = useState('living_room');

  const getGoveeScenes = async (ttrToken = null) => {
    const res = await gvGetScenes(ttrToken);
    // Check to see we got a response
    if (!res?.data?.data?.components) {
      setLoaded(false);
      return null;
    }

    const scenes = [];
    const ttrs = res.data.data.components;
    ttrs.forEach((ttr) => {
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
                        // eslint-disable-next-line max-len
                        const deviceName = iotRule.deviceObj.name;
                        const ttrName = oneClick.name;
                        const diyName = cmdVal?.diyName;

                        const getCode = () => {
                          let codeArray = [];
                          switch (iotMsg.msg.cmd) {
                          case 'ptUrl':
                            codeArray = iotMsg.msg.data.value;
                            // console.log('ptUrl', ttrName, iotMsg);
                            return `ptUrl.${codeArray.join(',')}`;
                          case 'ptReal':
                            codeArray = iotMsg.msg.data.command;
                            return codeArray.join(',');
                          default:
                            return '';
                          }
                        };
                        const code = getCode();
                        scenes.push({
                          deviceName, ttrName, code, diyName,
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
    return scenes;
  };

  const loadConfig = async () => {
    // console.log('getting hb-govee config...');
    const { data: scenesJson } = await apiGetScenes();
    const config = await apiGet('/api/config-editor/plugin/homebridge-govee')
      .then((result) => (result?.data ? result.data[0] : null))
      .catch((e) => e);
    // console.log('config', config);
    if (!config) {
      setLoaded(false);
      return Promise.reject();
    }
    const goveeConf = { config, scenes: {}, devices: {} };
    const scenes = {};
    const devices = {};

    /*
        1) Try using existing token to get scenes
        2) If failed, renew token by using auth login
        3) Retry getting scenes
         */
    let ttrScenes = await getGoveeScenes();
    if (!ttrScenes) {
      const ttrToken = await gvGetToken(config.username, config.password)
        .catch(() => null);
      // console.log('ttrToken', ttrToken);
      if (!ttrToken) {
        setLoaded(false);
        return new Error('Error retrieving Govee token.');
      }
      ttrScenes = await getGoveeScenes(ttrToken);
      if (!ttrScenes) {
        setLoaded(false);
        return new Error('Error retrieving Govee scenes.');
      }
    }
    console.log('ttrScenes', ttrScenes);

    const sceneNameIds = {};
    ttrScenes.forEach((scene) => {
      const matchDevice = scene.deviceName;
      const matchScene = scene.ttrName;
      const matchCode = scene.code;
      const matchRoom = deviceRooms[matchDevice] || 'living_room';
      if (!devices[matchDevice]) {
        devices[matchDevice] = { name: matchDevice, scenes: {}, room: matchRoom };
      }
      devices[matchDevice].scenes[matchScene] = matchCode;
      if (!scenes[matchScene]) {
        scenes[matchScene] = { name: matchScene, devices: {}, rooms: [] };
      }
      scenes[matchScene].devices[matchDevice] = matchCode;
      if (!scenes[matchScene].rooms.includes(matchRoom)) {
        scenes[matchScene].rooms.push(matchRoom);
      }
      sceneNameIds[matchCode] = { sceneName: matchScene, diyName: scene.diyName };
    });
    console.log('scenes', scenes, 'devices', devices, 'sceneNameIds', sceneNameIds);

    const slotNames = defaultSlots.reduce((acc, slotName) => {
      acc[slotName] = null;
      return acc;
    }, {});
    const [lightDevices, configScenes] = goveeConf.config.lightDevices.reduce((acc, light) => {
      acc[0][light.label] = {
        id: light.deviceId,
        slots: { ...slotNames },
      };
      const deviceRoom = deviceRooms[light.label] || 'living_room';
      defaultSlots.forEach((slotName) => {
        if (light[slotName]) {
          const sceneCode = light[slotName].sceneCode.trim();
          // eslint-disable-next-line prefer-const
          let { sceneName, diyName } = sceneNameIds[sceneCode] || { sceneName: null, diyName: null };
          if (!sceneName) {
            const sceneJson = scenesJson.find((s) => s.slot === slotName && s.room === deviceRoom);
            if (sceneJson) {
              sceneName = sceneJson.scene;
            }
          }
          if (sceneName) {
            acc[0][light.label].slots[slotName] = {
              sceneName,
              diyName,
              sceneCode,
              room: deviceRoom,
            };
            if (!acc[1][slotName][sceneName]) {
              acc[1][slotName][sceneName] = [];
            }
            acc[1][slotName][sceneName].push(light.label);
          } else {
            console.warn('scene code not found: ', sceneName, `'${sceneCode}'`, 'device', light);
          }
        }
      });
      return acc;
    }, [{}, defaultSlots.reduce((slotScenes, slot) => ({ ...slotScenes, [slot]: {} }), {})]);

    goveeConf.scenes = scenes;
    goveeConf.devices = devices;
    goveeConf.configScenes = configScenes;
    goveeConf.configDevices = lightDevices;
    goveeConf.ttrScenes = ttrScenes;
    setGoveeConfig(goveeConf);
    console.log('goveeConf', goveeConf);

    setLoaded(true);
    return Promise.resolve(goveeConf);
  };

  const getSceneSlots = async () => {
    const { data: scenesJson } = await apiGetScenes();
    const slots = rooms.reduce((acc, r) => {
      const roomSlots = defaultSlots.map((slot) => {
        const sceneSlot = scenesJson.find((ss) => ss.slot === slot && ss.room === r.key);
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
      Object.keys(goveeConfig.configDevices).forEach((deviceName) => {
        const deviceSlot = goveeConfig.configDevices[deviceName].slots[slotData.slot];
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
    console.log('sceneslots', slots);
    setSceneSlots(slots);
    return slots;
  };

  const getRoomSlots = () => sceneSlots.filter((ss) => ss.room === room);

  const getRoomScenes = () => Object.keys(goveeConfig.scenes || []).reduce((acc, s) => {
    if (goveeConfig.scenes[s].rooms.includes(room)) {
      acc[s] = goveeConfig.scenes[s];
    }
    return acc;
  }, {});

  const restartHomebridge = async () => {
    setRestarting(true);
    await apiPut('/api/server/restart');
    // look for data.status === up
    // iterate a setTimeout every 1 or 2 seconds
    // if status is not up, reinitate timer
    let status;
    do {
      // eslint-disable-next-line no-await-in-loop
      await asyncTimeout(1000);
      // eslint-disable-next-line no-await-in-loop
      const result = await apiGet('/api/status/homebridge');
      status = result?.data?.status;
    } while (status !== 'up');
    setRestarting(false);
    return Promise.resolve();
  };

  const reloadConfig = async (silent = false) => {
    if (!token) {
      console.warn('Preventing reload config due to UNAUTHENTICATED TOKEN');
      return null;
    }
    // console.log('REloading config...');
    if (!silent) {
      setLoaded(false);
    }
    const gConfig = await loadConfig().catch((err) => {
      console.warn('Error occurred while loading config...', err);
    });
    if (!silent) {
      setLoaded(true);
    }
    return Promise.resolve(gConfig);
  };

  const providerValue = useMemo(() => ({
    goveeConfig,
    loaded,
    reloadConfig,
    restartHomebridge,
    restarting,
    defaultSlots,
    getSceneSlots,
    getGoveeScenes,
    room,
    setRoom,
    getRoomSlots,
    getRoomScenes,
  }), [
    goveeConfig, loaded, restarting, defaultSlots,
    getSceneSlots, getGoveeScenes,
    room,
    setRoom,
    getRoomSlots,
    getRoomScenes,
  ]);

  return (
    <ConfigContext.Provider value={providerValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
