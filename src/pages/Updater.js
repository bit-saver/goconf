import React, { useContext, useState } from 'react';
import { Button, Grid, Stack } from '@mui/material';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';
import AlertContext from '../components/Alert';
import PageTitle from '../components/PageTitle';

const Updater = () => {
  const { apiPost, apiSaveScenes } = useContext(ApiContext);
  const {
    goveeConfig, getSceneSlots, restartHomebridge,
  } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);
  const [log, setLog] = useState([]);
  const [updates, setUpdates] = useState([]);

  const handleUpdate = async () => {
    if (updates.length < 1) {
      showAlert('error', 'No updates available');
      return;
    }
    const toLog = [];
    const { lightDevices } = goveeConfig.config;
    const sceneSlots = await getSceneSlots();
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
            success = true;
          } else {
            sceneSlots[index].devices.splice(ssdIndex, 1);
            success = true;
          }
        }
      }

      index = lightDevices.findIndex((light) => light.label === update.device);
      if (index >= 0) {
        if (update.code) {
          lightDevices[index][update.slot] = {
            sceneCode: update.code,
            showAs: 'switch',
          };
          toLog.push(`${!success ? '[HB ONLY] ' : ''} Updated scene: ${update.sceneName}`);
        } else {
          delete lightDevices[index][update.slot];
          toLog.push(`${!success ? '[HB ONLY] ' : ''} Deleted [${update.device}] from [${update.sceneName}`);
        }
      }
    });

    const updatedConfig = { ...goveeConfig.config, lightDevices };
    await apiPost('/api/config-editor/plugin/homebridge-govee', [updatedConfig]);
    await apiSaveScenes(sceneSlots);
    await restartHomebridge();
    setLog(toLog);
  };

  const handleGetUpdates = async () => {
    // for each sceneSlot
    //   compare with TTR
    //     device list (if any were removed, not added since we can't assume it's the right room)
    //     scene code for each device
    const toUpdate = [];
    const toLog = [];
    const { scenes } = goveeConfig;
    const sceneSlots = await getSceneSlots();
    sceneSlots.forEach((sceneSlot) => {
      const sceneName = (sceneSlot.room === 'office' ? 'Office ' : '') + sceneSlot.scene;
      if (sceneSlot.scene) {
        const sceneDevices = sceneSlot?.devices || [];
        const ttrScene = scenes[sceneName];
        if (ttrScene && ttrScene?.devices) {
          const ttrSceneDevices = ttrScene?.devices || {};
          sceneDevices.forEach(({ device, code }) => {
            if (!ttrSceneDevices[device]) {
              toUpdate.push({
                sceneName: sceneSlot.scene,
                code,
                device,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Device removed: ${device}`);
            } else if (ttrSceneDevices[device] !== code) {
              toUpdate.push({
                sceneName: sceneSlot.scene,
                device,
                code: null,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Scene code changed for: ${device}`);
            }
          });
        } else {
          updates.push(`[${sceneSlot.scene}][${sceneSlot.room}] ttrScene not found for device`);
        }
      }
    });
    setUpdates(toUpdate);
    setLog(toLog);
  };

  return (
    <Grid container item xs={12} spacing={0} justifyContent="center" id="page-container">
      <Grid item xs={12} md={6} lg={4} sx={{ position: 'relative' }}>
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
            // disabled={saveDisabled}
            onClick={handleGetUpdates}
          >
            GET UPDATES
          </Button>

          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={updates.length < 1}
            onClick={handleUpdate}
          >
            UPDATE
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default Updater;
