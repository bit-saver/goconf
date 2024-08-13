import React, { useContext, useState } from 'react';
import {
  Button, CircularProgress, Grid, Stack,
} from '@mui/material';
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
import AlertContext from '../util/contexts/Alert';
import PageTitle from '../components/PageTitle';

const Updater = () => {
  const { apiSaveScenes } = useContext(ApiContext);
  const {
    getHb, getGoconf, getGovee, restartHomebridge,
  } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);
  const [log, setLog] = useState([]);
  const [updates, setUpdates] = useState({ goconf: [], hb: [] });
  const [updating, setUpdating] = useState(false);
  const [gettingUpdates, setGettingUpdates] = useState(false);

  const hb = getHb();
  const goconf = getGoconf();
  const govee = getGovee();

  const handleUpdate = async () => {
    if (updates.goconf.length < 1 && updates.hb.length < 1) {
      showAlert('error', 'No updates available');
      return;
    }
    const toLog = [];
    setUpdating(true);
    setLog([]);
    const [, sceneSlots] = await Promise.all([hb.loadConfig(), goconf.reload()]);
    const { lightDevices } = hb.pluginConfig;
    updates.goconf.forEach((update) => {
      const index = sceneSlots.findIndex(
        (ss) => ss.ttrName === update.ttrName && ss.room === update.room && ss.slot === update.slot,
      );
      if (index > -1) {
        const ssdIndex = sceneSlots[index].devices.findIndex((d) => d.device === update.device);
        if (ssdIndex > -1) {
          if (update.code) {
            sceneSlots[index].devices[ssdIndex].code = update.code;
            sceneSlots[index].devices[ssdIndex].diyName = update.diyName;
            const ldIndex = lightDevices.findIndex((light) => light.label === update.device);
            if (ldIndex > -1) {
              lightDevices[ldIndex][update.slot].sceneCode = update.code;
            } else {
              lightDevices[ldIndex][update.slot] = {
                sceneCode: update.code,
                showAs: 'switch',
              };
            }
            toLog.push(`[${update.sceneName}][${update.room}] Scene code updated for: ${update.device}`);
          } else {
            sceneSlots[index].devices.splice(ssdIndex, 1);
            const ldIndex = lightDevices.findIndex((light) => light.label === update.device);
            if (ldIndex > -1) {
              delete lightDevices[ldIndex][update.slot];
              toLog.push(`[${update.sceneName}][${update.room}] Device removed: ${update.device}`);
            }
          }
        } else {
          sceneSlots[index].devices.push({
            device: update.device,
            code: update.code,
            diyName: update.diyName,
          });
          const ldIndex = lightDevices.findIndex((light) => light.label === update.device);
          if (ldIndex > -1) {
            lightDevices[ldIndex][update.slot].sceneCode = update.code;
          } else {
            lightDevices[ldIndex][update.slot] = {
              sceneCode: update.code,
              showAs: 'switch',
            };
          }
          toLog.push(`[${update.sceneName}][${update.room}] Device added: ${update.device}`);
        }
      }
    });

    updates.hb.forEach(({
      scene, slot, device, sceneCode,
    }) => {
      const index = lightDevices.findIndex((light) => light.label === device);
      if (index >= 0) {
        if (sceneCode) {
          lightDevices[index][slot] = {
            sceneCode,
            showAs: 'switch',
          };
          toLog.push(`[HB] Updated ${device} for scene: ${scene}`);
        }
      }
    });

    const updatedConfig = { ...hb.pluginConfig, lightDevices };
    await Promise.all([hb.saveConfig(updatedConfig), apiSaveScenes(sceneSlots)]);
    goconf.setSceneSlots(sceneSlots);
    setLog(toLog);
    await restartHomebridge();
    setUpdating(false);
  };

  const handleGetUpdates = async () => {
    const toUpdate = [];
    const toLog = [];
    const hbUpdates = [];
    setUpdates({ goconf: [], hb: [] });
    setLog([]);
    // for each sceneSlot
    //   compare with TTR
    //     device list (if any were removed, not added since we can't assume it's the right room)
    //     scene code for each device
    setGettingUpdates(true);
    await govee.getTTRs();
    const [,, sceneSlots] = await Promise.all([govee.getTTRs(), hb.loadConfig(), goconf.reload()]);
    const { scenes } = govee;
    const { lightDevices } = hb.pluginConfig;
    const hbDevices = [...lightDevices];
    sceneSlots.forEach((sceneSlot) => {
      const sceneName = sceneSlot.ttrName;
      if (sceneSlot.scene) {
        const goconfSceneDevices = sceneSlot?.devices || [];
        const ttrScene = scenes[sceneName];
        if (ttrScene && ttrScene?.devices) {
          // We have a govee TTR scene and a list of goconf scene devices.
          // Devices in the goconf scene not found in the govee scene need to be REMOVED from goconf scene.
          // Devices in the govee scene not found in the goconf scene need to be ADDED to the goconf scene.
          const ttrSceneDevices = ttrScene?.devices || {};
          Object.keys(ttrSceneDevices).forEach((device) => {
            // for each GOVEE device, check for changed codes, or new devices
            const sdIndex = goconfSceneDevices.findIndex((sd) => sd.device === device);
            if (sdIndex === -1) {
              // add this device to GOCONF
              toUpdate.push({
                sceneName: sceneSlot.scene,
                ttrName: sceneSlot.ttrName,
                code: ttrSceneDevices[device].code,
                diyName: ttrSceneDevices[device].diyName,
                device,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Device added: ${device}`);
            } else if (goconfSceneDevices[sdIndex].code !== ttrSceneDevices[device].code) {
              // update the code for this device in GOCONF
              toUpdate.push({
                sceneName: sceneSlot.scene,
                ttrName: sceneSlot.ttrName,
                device,
                code: ttrSceneDevices[device].code,
                diyName: ttrSceneDevices[device].diyName,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Scene code changed for: ${device}`);
            }
          });
          goconfSceneDevices.forEach(({ device, code }) => {
            // for each GOCONF scene device, check for deleted devices
            if (!ttrSceneDevices[device]?.code) {
              toUpdate.push({
                sceneName: sceneSlot.scene,
                ttrName: sceneSlot.ttrName,
                code: null,
                device,
                room: sceneSlot.room,
                slot: sceneSlot.slot,
              });
              toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] Device removed: ${device}`);
            }

            // check for differences in the HB light devices
            const hbLightDevice = hbDevices.find((ld) => ld.label === device);
            if (hbLightDevice) {
              const hbLightDeviceSlot = hbLightDevice[sceneSlot.slot];
              if (hbLightDeviceSlot) {
                if (code !== hbLightDeviceSlot.sceneCode) {
                  hbUpdates.push({
                    sceneCode: ttrSceneDevices[device]?.code ? code : null,
                    slot: sceneSlot.slot,
                    device,
                    room: sceneSlot.room,
                    scene: sceneSlot.scene,
                    ttrName: sceneSlot.ttrName,
                  });
                  console.log('hb scene code update for', hbLightDevice, hbLightDeviceSlot, ttrSceneDevices[device]);
                  toLog.push(`[${sceneSlot.scene}][${device}] Update to scene code on HB for: ${sceneSlot.slot}`);
                }
              } else {
                toLog.push(`[${sceneSlot.scene}][${device}] Homebridge missing device slot: ${sceneSlot.slot}`);
                hbUpdates.push({
                  sceneCode: ttrSceneDevices[device]?.code ? code : null,
                  slot: sceneSlot.slot,
                  device,
                  room: sceneSlot.room,
                  scene: sceneSlot.scene,
                  ttrName: sceneSlot.ttrName,
                });
              }
            } else {
              toLog.push(`[${sceneSlot.scene}][${device}] Homebridge missing device`);
            }
          });
        } else if (sceneSlot.room !== 'hallway') {
          toLog.push(`[${sceneSlot.scene}][${sceneSlot.room}] ttrScene not found for device`);
          console.log('missing ttr scene', sceneSlot, ttrScene);
        }
      }
    });
    toUpdate.forEach(({ code, device, slot }) => {
      const index = hbUpdates.findIndex((hbu) => hbu.device === device && hbu.slot === slot);
      if (index > -1) {
        hbUpdates[index].sceneCode = code;
      }
    });
    console.log('toUpdate', toUpdate);
    console.log('hbUpdates', hbUpdates);
    setUpdates({ goconf: toUpdate, hb: hbUpdates });
    if (!toUpdate.length && !hbUpdates.length) {
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
