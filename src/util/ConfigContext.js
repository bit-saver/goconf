import React, {
    createContext, useContext, useMemo, useState,
} from 'react';
import ApiContext from './ApiContext';
import { asyncTimeout, defaultSlots, rgbModels } from './util';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
    const {
        apiGet, apiPut, apiGetScenes, gvGetToken, gvGetScenes,
    } = useContext(ApiContext);
    const [goveeConfig, setGoveeConfig] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [restarting, setRestarting] = useState(false);

    const getGoveeScenes = async (ttrToken) => {
        const res = await gvGetScenes(ttrToken);
        // Check to see we got a response
        if (!res?.data?.data?.components) {
            setLoaded(false);
            throw new Error('not a valid response');
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
                                            if (iotMsg.msg?.cmd === 'ptReal') {
                                                // eslint-disable-next-line max-len
                                                // this.log('[%s] [%s] [AWS] %s', iotRule.deviceObj.name, oneClick.name, iotMsg.msg.data.command.join(','));
                                                const deviceName = iotRule.deviceObj.name;
                                                const ttrName = oneClick.name;
                                                const code = iotMsg.msg.data.command.join(',');
                                                scenes.push({ deviceName, ttrName, code });
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
        console.log(scenes);
        return scenes;
    };

    const loadConfig = async () => {
        console.log('getting hb-govee config...');
        const config = await apiGet('/api/config-editor/plugin/homebridge-govee').then((result) => (result?.data ? result.data[0] : null)).catch((e) => e);
        console.log('config', config);
        if (!config) {
            setLoaded(false);
            return Promise.reject();
        }
        const goveeConf = { config, scenes: {}, devices: {} };
        const scenes = {};
        const devices = {};

        // eslint-disable-next-line max-len
        // const { data: log } = await apiGet('/api/platform-tools/hb-service/log/download?colour=no');
        // const matches = [...log.matchAll(/\[Govee] \[([\w ]+)] \[([\w ]+)] \[AWS] (.+)(?=\n)/g)];
        // console.log('matches', matches);
        // // 1 device, 2 scene name (tap to run), 3 scene id (aws)
        // const sceneNameIds = {};
        // matches.forEach((match) => {
        //     const matchDevice = match[1].trim();
        //     const matchScene = match[2].trim();
        //     const matchCode = match[3].trim();
        //     if (!devices[matchDevice]) {
        //         devices[matchDevice] = { name: matchDevice, scenes: {} };
        //     }
        //     devices[matchDevice].scenes[matchScene] = matchCode;
        //     if (!scenes[matchScene]) {
        //         scenes[matchScene] = { name: matchScene, devices: {} };
        //     }
        //     scenes[matchScene].devices[matchDevice] = matchCode;
        //     sceneNameIds[matchCode] = matchScene;
        // });

        /*
        1) Try using existing token to get scenes
        2) If failed, renew token by using auth login
        3) Retry getting scenes
         */
        let ttrScenes = await gvGetScenes().then((result) => result.data).catch(() => null);
        console.log('ttrScenes', ttrScenes);
        if (!ttrScenes || [400, 401, 402].includes(ttrScenes.status)) {
            const ttrToken = await gvGetToken(config.username, config.password)
                .catch(() => null);
            console.log('ttrToken', ttrToken);
            if (!ttrToken) {
                setLoaded(false);
                return new Error('Error retrieving Govee token.');
            }
            ttrScenes = await gvGetScenes(ttrToken).then((result) => result.data).catch(() => null);
            if (!ttrScenes || [400, 401, 402].includes(ttrScenes.status)) {
                setLoaded(false);
                return new Error('Error retrieving Govee scenes.');
            }
        }

        const sceneNameIds = {};
        ttrScenes.forEach((scene) => {
            const matchDevice = scene.deviceName;
            const matchScene = scene.ttrName;
            const matchCode = scene.code;
            if (!devices[matchDevice]) {
                devices[matchDevice] = { name: matchDevice, scenes: {} };
            }
            devices[matchDevice].scenes[matchScene] = matchCode;
            if (!scenes[matchScene]) {
                scenes[matchScene] = { name: matchScene, devices: {} };
            }
            scenes[matchScene].devices[matchDevice] = matchCode;
            sceneNameIds[matchCode] = matchScene;
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
            defaultSlots.forEach((name) => {
                if (light[name]) {
                    const sceneCode = light[name].sceneCode.trim();
                    const sceneName = sceneNameIds[sceneCode];
                    if (sceneName) {
                        acc[0][light.label].slots[name] = { sceneName, sceneCode };
                        if (!acc[1][name][sceneName]) {
                            acc[1][name][sceneName] = [];
                        }
                        acc[1][name][sceneName].push(light.label);
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
        setGoveeConfig(goveeConf);
        // console.log('configured devices', lightDevices, 'scenes', configScenes);

        setLoaded(true);
        return Promise.resolve();
    };

    const getSceneSlots = async () => {
        const { data: scenesJson } = await apiGetScenes();
        return defaultSlots.map((slot) => {
            const sceneSlot = scenesJson.find((ss) => ss.slot === slot);
            if (!sceneSlot) {
                return {
                    slot,
                    scene: null,
                    lights: [],
                };
            }
            const ret = { ...sceneSlot };
            if (!ret.lights) {
                ret.lights = [];
            }
            return ret;
        });
        // return defaultSlots.reduce((acc, slot) => {
        //     const sceneSlot = scenesJson.find((ss) => ss.slot === slot);
        //     acc[slot] = sceneSlot?.scene || '';
        //     return acc;
        // }, {});
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
    };

    // useEffect(() => {
    //     console.log('loading config...', token, goveeConfig, loaded);
    //     if (token && !goveeConfig && !loaded) {
    //         loadConfig().then(() => {
    //             console.log('config loaded');
    //             setLoaded(true);
    //         }).catch((err) => {
    //             console.warn('Error occurred while loading config...', err);
    //         });
    //     }
    // }, [token, goveeConfig, loaded]);

    const reloadConfig = async () => {
        console.log('REloading config...');
        setLoaded(false);
        await loadConfig().catch((err) => {
            console.warn('Error occurred while loading config...', err);
        });
        setLoaded(true);
        return Promise.resolve();
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
    }), [
        goveeConfig, loaded, restarting, defaultSlots,
        getSceneSlots, getGoveeScenes,
    ]);

    return (
        <ConfigContext.Provider value={providerValue}>
            {children}
        </ConfigContext.Provider>
    );
}

export default ConfigContext;
