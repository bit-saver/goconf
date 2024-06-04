import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import ApiContext from './ApiContext';
import {
  asyncTimeout, defaultSlots,
} from './util';
import HomebridgeConfig from './configs/HomebridgeConfig';
import GoveeConfig from './configs/GoveeConfig';
import GoconfConfig from './configs/GoconfConfig';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const apiProvider = useContext(ApiContext);
  const {
    apiGet, apiPut, token,
  } = apiProvider;

  const [loaded, setLoaded] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [room, setRoom] = useState('living_room');

  const [goconf, setGoconf] = useState(null);
  const [govee, setGovee] = useState(null);
  const [hb, setHb] = useState(null);

  const getHbConfigFile = () => apiGet('/api/config-editor/plugin/homebridge-govee')
    .then((result) => (result?.data ? result.data[0] : null))
    .catch((e) => e);

  const loadConfig = async () => {
    // Get Goconf Scenes JSON
    // Get Homebridge plugin config file
    const goconfConfig = new GoconfConfig(apiProvider);
    const promises = await Promise.all([goconfConfig.reload(), getHbConfigFile()]);

    const hbConfigFile = promises[1];
    if (!hbConfigFile) {
      setLoaded(false);
      return Promise.reject();
    }

    // Set Govee credentials from hbConfig
    const goveeCreds = { username: hbConfigFile.username, password: hbConfigFile.password };
    const goveeConfig = new GoveeConfig(goveeCreds, apiProvider);

    // Load TTR scenes (goveeConfig) (gvGetScenes and parse)
    // Separate TTR scenes into scenes and devices (goveeConfig)
    await goveeConfig.getTTRs();

    // Load HB scenes and devices (hbConfig) (needs goconfScenes for scene names)
    const hbConfig = new HomebridgeConfig(hbConfigFile, goconfConfig.sceneSlots);

    setGoconf(goconfConfig);
    setGovee(goveeConfig);
    setHb(hbConfig);

    const configs = {
      goconf: goconfConfig,
      govee: goveeConfig,
      hb: hbConfig,
    };

    console.log(
      'configs',
      'goconf scene slots',
      goconfConfig.sceneSlots,
    );
    console.log(
      'hbconfig devices',
      hbConfig.devices,
      'hbconfig scenes',
      hbConfig.scenes,
    );
    console.log(
      'govee scenes',
      goveeConfig.scenes,
      'govee devices',
      goveeConfig.devices,
    );

    setLoaded(true);

    return Promise.resolve(configs);
  };

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
    const configs = await loadConfig().catch((err) => {
      console.warn('Error occurred while loading config...', err);
    });
    if (!silent) {
      setLoaded(true);
    }
    return Promise.resolve(configs);
  };

  const providerValue = useMemo(() => ({
    loaded,
    reloadConfig,
    restartHomebridge,
    restarting,
    defaultSlots,
    room,
    setRoom,
    govee,
    goconf,
    hb,
  }), [
    loaded, restarting, defaultSlots,
    room,
    setRoom,
    govee, goconf, hb,
  ]);

  return (
    <ConfigContext.Provider value={providerValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
