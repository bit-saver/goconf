import React, {
  createContext, useContext, useMemo, useRef, useState,
} from 'react';
import ApiContext from './ApiContext';
import {
  asyncTimeout, defaultSlots,
} from '../util';
import HomebridgeConfig from '../configs/HomebridgeConfig';
import GoveeConfig from '../configs/GoveeConfig';
import GoconfConfig from '../configs/GoconfConfig';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const apiProvider = useContext(ApiContext);
  const {
    apiGet, apiPut, tokenRef,
  } = apiProvider;

  const [loaded, setLoaded] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [room, setRoom] = useState('living_room');

  // const [goconf, setGoconf] = useState(null);
  // const [govee, setGovee] = useState(null);
  // const [hb, setHb] = useState(null);

  const goconfRef = useRef(null);
  const goveeRef = useRef(null);
  const hbRef = useRef(null);

  const setGoconf = (config) => { goconfRef.current = config; };
  const setGovee = (config) => { goveeRef.current = config; };
  const setHb = (config) => { hbRef.current = config; };

  const getGoconf = () => goconfRef.current;
  const getGovee = () => goveeRef.current;
  const getHb = () => hbRef.current;

  const initializeConfigs = async () => {
    console.log('[Config] Initializing configs...');
    const goconfConfig = new GoconfConfig(apiProvider);
    const hbConfig = new HomebridgeConfig(apiProvider, goconfConfig);
    try {
      // Get Goconf Scenes JSON
      // Get Homebridge plugin config file
      console.log('[Config] loading goconf and hb...');
      await Promise.all([goconfConfig.reload(), hbConfig.loadConfig()]);
      console.log('[Config] loading govee...');
      const goveeConfig = new GoveeConfig(apiProvider);
      await goveeConfig.getToken(hbConfig.goveeCredentials);
      setGoconf(goconfConfig);
      setHb(hbConfig);
      setGovee(goveeConfig);
    } catch (err) {
      console.error('[Config] Error initializing configs...', err);
      setLoaded(false);
      return Promise.reject(err);
    }
    return Promise.resolve();
  };

  const loadConfig = async () => {
    // Load TTR scenes (goveeConfig) (gvGetScenes and parse)
    // Separate TTR scenes into scenes and devices (goveeConfig)

    // await getGovee().getTTRs();
    // console.log('[Config] govee loaded');

    // Load HB scenes and devices (hbConfig) (needs goconfScenes for scene names)
    getHb().setGoconfScenes(getGoconf().sceneSlots);

    const configs = {
      goconf: getGoconf(),
      govee: getGovee(),
      hb: getHb(),
    };

    console.log(
      'configs',
      'goconf scene slots',
      configs.goconf.sceneSlots,
    );
    console.log(
      'hbconfig devices',
      configs.hb.devices,
      'hbconfig scenes',
      configs.hb.scenes,
    );
    console.log(
      'govee scenes',
      configs.govee.scenes,
      'govee devices',
      configs.govee.devices,
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
    console.log('[Config] reloading config...');
    if (!tokenRef.current) {
      console.warn('[Config] Preventing reload config due to UNAUTHENTICATED TOKEN');
      return null;
    }
    if (!silent) {
      setLoaded(false);
    }
    console.log('[Config] calling loadConfig...');
    await initializeConfigs();
    const configs = await loadConfig().catch((err) => {
      console.warn('Error occurred while loading config...', err);
      return null;
    });
    if (!silent) {
      setLoaded(true);
    }
    console.log('[Config] resolving...');
    return Promise.resolve(configs);
  };

  const providerValue = useMemo(() => ({
    loaded,
    setLoaded,
    pageLoading,
    setPageLoading,
    initializeConfigs,
    reloadConfig,
    restartHomebridge,
    restarting,
    defaultSlots,
    room,
    setRoom,
    getGovee,
    getGoconf,
    getHb,
  }), [
    initializeConfigs,
    loaded, restarting, defaultSlots,
    setLoaded,
    pageLoading,
    setPageLoading,
    room,
    setRoom,
    getGovee,
    getGoconf,
    getHb,
  ]);

  return (
    <ConfigContext.Provider value={providerValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
