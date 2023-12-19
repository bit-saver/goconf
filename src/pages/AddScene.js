import {
  Button,
  Card, Checkbox,
  FormControl, Grid,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon, ListItemText,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import ListTable from '../components/ListTable';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';
import { defaultSlots } from '../util/util';
import AlertContext from '../components/Alert';

function AddScene() {
  const { apiPost, apiSaveScenes } = useContext(ApiContext);
  const { goveeConfig, getSceneSlots } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);

  const { scenes, devices } = goveeConfig;

  const [selectedScene, setSelectedScene] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);

  const [sceneSlots, setSceneSlots] = useState([]);

  useEffect(() => {
    getSceneSlots().then((result) => {
      const sss = result.reduce((acc, ss) => {
        acc[ss.slot] = ss.scene;
        return acc;
      }, {});
      setSceneSlots(sss);
    });
  }, []);

  const handleSelectScene = (e) => {
    const scene = e.target.value;
    setSelectedScene(scene);
    const selected = Object.keys(devices).sort().reduce((acc, deviceName) => {
      const disabled = !devices[deviceName].scenes[scene];
      if (!disabled) {
        acc.push({ name: deviceName, deviceName, disabled });
      }
      return acc;
    }, []);
    setSelectedDevices(selected);
  };

  const handleDeviceCheck = (value) => () => {
    const currentIndex = selectedDevices.indexOf(value);
    const newChecked = [...selectedDevices];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setSelectedDevices(newChecked);
  };

  const handleSave = async () => {
    if (!selectedSlot || !selectedScene) {
      return;
    }
    const sceneData = scenes[selectedScene];
    if (!sceneData) {
      return;
    }
    const { lightDevices } = goveeConfig.config;
    selectedDevices.forEach(({ name: deviceName }) => {
      const index = lightDevices.findIndex((light) => light.label === deviceName);
      if (index >= 0) {
        lightDevices[index][selectedSlot] = {
          sceneCode: sceneData.devices[deviceName],
          showAs: 'switch',
        };
      }
    });

    const updatedConfig = { ...goveeConfig.config, lightDevices };
    const { data: result } = await apiPost('/api/config-editor/plugin/homebridge-govee', [updatedConfig]);
    console.log('save config result:', result);

    const update = await getSceneSlots();
    console.log('slot', selectedSlot, 'scene', selectedScene);
    const index = update.findIndex((ss) => ss.slot === selectedSlot);
    if (index > -1) {
      update[index].scene = selectedScene;
      await apiSaveScenes(update);
    }

    setSelectedScene('');
    setSelectedSlot('');
    setSelectedDevices([]);
    showAlert('success', 'Scene added!');
  };

  const saveDisabled = !selectedScene || !selectedSlot || selectedDevices.length < 1;

  return (
    <Grid container item xs={12} spacing={4} justifyContent="center">
      <Grid item xs={12} md={6} lg={4}>
        <h1>Add Scenes</h1>
        <Stack spacing={4}>
          <FormControl fullWidth>
            <InputLabel id="label-scene">Scene</InputLabel>
            <Select
              labelId="label-scene"
              id="select-scene"
              value={selectedScene}
              label="Scene"
              onChange={handleSelectScene}
            >
              {Object.keys(scenes).sort().map((s) => (
                <MenuItem value={s} key={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="label-slot">Slot</InputLabel>
            <Select
              labelId="label-slot"
              id="select-slot"
              value={selectedSlot}
              label="Slot"
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              {defaultSlots.map((s) => (
                <MenuItem value={s} key={s}>
                  <b>{s}</b>
                  <small>
                    &nbsp;(
                    {sceneSlots[s]}
                    )
                  </small>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Card variant="outlined">
            <ListTable
              selected={selectedDevices}
              setSelected={setSelectedDevices}
              rows={
                Object.keys(devices).sort().map((deviceName) => {
                  const disabled = !devices[deviceName].scenes[selectedScene];
                  return { deviceName, name: deviceName, disabled };
                })
              }
            />
            <List sx={{ display: 'none' }}>
              {Object.keys(devices).sort().map((deviceName) => {
                const labelId = `select-devices-label-${deviceName}`;
                const enabledDevice = !!devices[deviceName].scenes[selectedScene];
                return (
                  <ListItem disablePadding key={deviceName}>
                    <ListItemButton
                      disabled={!enabledDevice}
                      role={undefined}
                      onClick={handleDeviceCheck(deviceName)}
                      dense
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={
                            selectedDevices.indexOf(deviceName) !== -1
                          }
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText id={labelId} primary={deviceName} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Card>
          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={saveDisabled}
            onClick={handleSave}
          >
            SAVE
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default AddScene;
