import React, { useContext, useState } from 'react';
import {
  Button, CircularProgress, Grid, Stack,
} from '@mui/material';
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
import AlertContext from '../util/contexts/Alert';
import PageTitle from '../components/PageTitle';

const Updater = () => {
  const { apiPost, apiSaveScenes } = useContext(ApiContext);
  const {
    getHb, getGoconf, getGovee, restartHomebridge,
  } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);
  const [log, setLog] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [gettingUpdates, setGettingUpdates] = useState(false);

  const hb = getHb();
  const goconf = getGoconf();
  const govee = getGovee();

  const handleUpdate = async () => {
    if (updates.length < 1) {
      showAlert('error', 'No updates available');
      return;
    }
    setUpdating(true);
    const toLog = [];
    const { lightDevices } = hb.pluginConfig;
    const sceneSlots = await goconf.reload();
    updates.forEach((update) => {
      let success = false;
      let index = sceneSlots.findIndex(
        (ss) => ss.scene === update.sceneName && ss.room === update.room && ss.slot === update.slot,
      );
      if (index > -1) {
        const ssdIndex = sceneSlots[index].devices.findIndex((d) => d.device === update.device);
        if (ssdIndex > -1) {
          if (update.code) {
            sceneSlots[index].devices[ssdIndex].code = update.code;
            sceneSlots[index].devices[ssdIndex].diyName = update.diyName;
            success = true;
          } else {
            sceneSlots[index].devices.splice(ssdIndex, 1);
            success = true;
          }
        } else {
          sceneSlots[index].devices.push({
            device: update.device,
            code: update.code,
            diyName: update.diyName,
          });
        }
      }

      index = lightDevices.findIndex((light) => light.label === update.device);
      if (index >= 0) {
        if (update.code) {
          lightDevices[index][update.slot] = {
            sceneCode: update.code,
            showAs: 'switch',
          };
          toLog.push(`${!success ? '[HB ONLY] ' : ''} Updated ${update.device} for scene: ${update.sceneName}`);
        } else {
          delete lightDevices[index][update.slot];
          toLog.push(`${!success ? '[HB ONLY] ' : ''} Deleted ${update.device} from: ${update.sceneName}`);
        }
      }
    });

    const updatedConfig = { ...hb.pluginConfig, lightDevices };
    await apiPost('/api/config-editor/plugin/homebridge-govee', [updatedConfig]);
    hb.pluginConfig = updatedConfig;
    await apiSaveScenes(sceneSlots);
    goconf.setSceneSlots(sceneSlots);
    restartHomebridge().then();
    setLog(toLog);
    setUpdating(false);
  };

  const handleGetUpdates = async () => {
    // for each sceneSlot
    //   compare with TTR
    //     device list (if any were removed, not added since we can't assume it's the right room)
    //     scene code for each device
    setGettingUpdates(true);
    await govee.getTTRs();
    const toUpdate = [];
    const toLog = [];
    const { scenes } = govee;
    const sceneSlots = await goconf.reload();
    sceneSlots.forEach((sceneSlot) => {
      const sceneName = (sceneSlot.room === 'office' ? 'Office ' : '') + sceneSlot.scene;
      if (sceneSlot.scene) {
        const sceneDevices = sceneSlot?.devices || [];
        const ttrScene = scenes[sceneName];
        if (ttrScene && ttrScene?.devices) {
          if (sceneName === 'Dark Rainbow') {
            console.log('Dark Rainbow sceneSlot', sceneSlot, 'ttrScene', ttrScene);
          }
          // we have a govee TTR scene and a list of goconf scene devices
          // devices in the goconf scene not found in the govee scene need to be REMOVED from goconf scene
          // devices in the govee scene not found in the goconf scene need to be ADDED to the goconf scene
          const ttrSceneDevices = ttrScene?.devices || {};
          Object.keys(ttrSceneDevices).forEach((device) => {
            // for each GOVEE device, check for changed codes, or new devices
            const sdIndex = sceneDevices.findIndex((sd) => sd.device === device);
            if (sdIndex === -1) {
              // add this device to GOCONF
              toUpdate.push({
                sceneName: sceneSlot.scene,
                code: ttrSceneDevices[device].code,
                diyName: ttrSceneDevices[device].diyName,
                device,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Device added: ${device}`);
            } else if (sceneDevices[sdIndex].code !== ttrSceneDevices[device].code) {
              // update the code for this device in GOCONF
              toUpdate.push({
                sceneName: sceneSlot.scene,
                device,
                code: ttrSceneDevices[device].code,
                diyName: ttrSceneDevices[device].diyName,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Scene code changed for: ${device}`);
            }
          });
          sceneDevices.forEach(({ device, code }) => {
            // for each GOCONF scene device, check for deleted devices
            if (!ttrSceneDevices[device]?.code) {
              toUpdate.push({
                sceneName: sceneSlot.scene,
                code: null,
                device,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Device removed: ${device}`);
            }
          });
        } else {
          updates.push(`[${sceneSlot.scene}][${sceneSlot.room}] ttrScene not found for device`);
        }
      }
    });
    setUpdates(toUpdate);
    if (!toUpdate.length) {
      toLog.push('No updates found');
    }
    setLog(toLog);
    setGettingUpdates(false);
  };

  const buttonsDisabled = gettingUpdates || updating;

  return (
    <Grid container item xs={12} spacing={0} justifyContent="center" id="page-container">
      <Grid item xs={12} md={6} lg={10} sx={{ position: 'relative' }}>
        <Stack spacing={4}>
          <PageTitle
            title="Updater"
            subtitle="Automatically update any scenes (TTRs) that have changed"
          />

          {log && (
            <pre>
              {log.join('\n')}
            </pre>
          )}

          <Button
            variant="contained"
            color="info"
            size="large"
            disabled={buttonsDisabled}
            onClick={handleGetUpdates}
          >
            {gettingUpdates && <CircularProgress />}
            {!gettingUpdates && <>GET UPDATES</>}
          </Button>

          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={buttonsDisabled || updates.length < 1}
            onClick={handleUpdate}
          >
            {updating && <CircularProgress />}
            {!updating && <>UPDATE</>}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default Updater;
