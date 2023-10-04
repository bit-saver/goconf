import React, {
    createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import ApiContext from './ApiContext';

export const asyncTimeout = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

export const defaultSlots = [
    'scene', 'sceneTwo', 'sceneThree', 'sceneFour',
    'diyMode', 'diyModeTwo', 'diyModeThree', 'diyModeFour',
    'segmented', 'segmentedTwo', 'segmentedThree', 'segmentedFour',
    'musicMode', 'musicModeTwo', 'musicModeThree', 'musicModeFour',
];

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
    const {
        token, apiGet, apiPut,
    } = useContext(ApiContext);
    const [goveeConfig, setGoveeConfig] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [restarting, setRestarting] = useState(false);

    const loadConfig = async () => {
        console.log('getting hb-govee config...');
        const config = await apiGet('/api/config-editor/plugin/homebridge-govee').then((result) => (result?.data ? result.data[0] : null)).catch((e) => e);
        console.log('config', config);
        if (!config) {
            return Promise.reject();
        }
        const goveeConf = { config, scenes: {}, devices: {} };
        const scenes = {};
        const devices = {};

        const { data: log } = await apiGet('/api/platform-tools/hb-service/log/download?colour=no');
        const matches = [...log.matchAll(/\[Govee] \[([\w ]+)] \[([\w ]+)] \[AWS] (.+)(?=\n)/g)];
        // 1 device, 2 scene name (tap to run), 3 scene id (aws)
        const sceneNameIds = {};
        matches.forEach((match) => {
            const matchDevice = match[1].trim();
            const matchScene = match[2].trim();
            const matchCode = match[3].trim();
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
        // console.log('scenes', scenes, 'devices', devices, 'sceneNameIds', sceneNameIds);

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
                        console.warn('scene code not found: ', `'${sceneCode}'`, 'device', light);
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
        return Promise.resolve();
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

    useEffect(() => {
        console.log('loading config...', token, goveeConfig, loaded);
        if (token && !goveeConfig && !loaded) {
            loadConfig().then(() => {
                console.log('config loaded');
                setLoaded(true);
            }).catch((err) => {
                console.warn('Error occurred while loading config...', err);
            });
        }
    }, [token, goveeConfig, loaded]);

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
        goveeConfig, loaded, reloadConfig, restartHomebridge, restarting,
    }), [goveeConfig, loaded, restarting]);

    return (
        <ConfigContext.Provider value={providerValue}>
            {children}
        </ConfigContext.Provider>
    );
}

export default ConfigContext;
