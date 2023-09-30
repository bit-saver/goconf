import React, { useContext, useEffect, useState } from 'react';
import {
  Grid,
} from '@mui/material';
import ApiContext from '../ApiContext';
import EditSceneSlots from '../components/EditSceneSlots';
import AddScene from './AddScene';
import RemoveScene from './RemoveScene';
import ViewDevices from './ViewDevices';

export const asyncTimeout = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const defaultSlots = [
  'scene', 'sceneTwo', 'sceneThree', 'sceneFour',
  'diyMode', 'diyModeTwo', 'diyModeThree', 'diyModeFour',
  'segmented', 'segmentedTwo', 'segmentedThree', 'segmentedFour',
  'musicMode', 'musicModeTwo', 'musicModeThree', 'musicModeFour',
];

function Config({ page }) {
  const {
    token, apiGet,
  } = useContext(ApiContext);
  const [goveeConfig, setGoveeConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadConfig = async () => {
    const { data: [config] } = await apiGet('/api/config-editor/plugin/homebridge-govee');
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

  useEffect(() => {
    if (token && !goveeConfig && !loaded) {
      loadConfig().then(() => {
        setLoaded(true);
      }).catch((err) => {
        console.warn('Error occurred while loading config...', err);
      });
    }
  }, [token, goveeConfig, loaded]);

  if (!loaded) return '';
  return (
    <Grid container spacing={4} justifyContent="center">
      { page === 'addScene'
          && <AddScene goveeConfig={goveeConfig} />}
      { page === 'removeScene'
          && <RemoveScene goveeConfig={goveeConfig} />}
      { page === 'editSceneSlots'
          && <EditSceneSlots />}
      { page === 'viewDevices'
          && <ViewDevices goveeConfig={goveeConfig} />}
    </Grid>
  );
}

export default Config;
