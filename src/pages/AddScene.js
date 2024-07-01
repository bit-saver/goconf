import {
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import ListTable from '../components/ListTable';
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
import { defaultSlots, getRoomName, rooms } from '../util/util';
import AlertContext from '../util/contexts/Alert';
import PageTitle from '../components/PageTitle';

const AddScene = () => {
  const { apiPost, apiSaveScenes, apiGetScenes } = useContext(ApiContext);
  const {
    getGovee, getGoconf, getHb, room,
  } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);

  const govee = getGovee();
  const goconf = getGoconf();
  const hb = getHb();

  const { scenes, devices } = govee || { scenes: {}, devices: {} };

  const [selectedScene, setSelectedScene] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);

  const [sceneSlots, setSceneSlots] = useState([]);

  const [prefixFilter, setPrefixFilter] = useState(true);

  useEffect(() => {
    if (goconf) {
      const sss = goconf.sceneSlots.reduce((acc, ss) => {
        if (!acc[ss.room]) {
          acc[ss.room] = {};
        }
        acc[ss.room][ss.slot] = ss.scene;
        return acc;
      }, {});
      setSceneSlots(sss);
    }
  }, [goconf, room]);

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
    console.log('sceneData', sceneData);
    console.log('selectedDevices', selectedDevices, selectedSlot);
    if (!sceneData) {
      return;
    }

    await hb.updateConfig(selectedDevices, selectedSlot, sceneData);

    await goconf.reconstruct(hb.devices);

    const index = goconf.sceneSlots.findIndex((ss) => ss.slot === selectedSlot && ss.room === room);
    if (index > -1) {
      const sceneDevices = Object.keys(sceneData.devices).map((deviceName) => ({
        device: deviceName,
        code: sceneData.devices[deviceName].code,
        diyName: sceneData.devices[deviceName].diyName,
      }));
      await goconf.updateScene({
        ...goconf.sceneSlots[index],
        scene: selectedScene.replace('Office ', ''),
        ttrName: selectedScene,
        room,
        devices: sceneDevices,
      });
    } else {
      console.error('no index found for ', selectedSlot, room);
    }

    setSelectedScene('');
    setSelectedSlot('');
    setSelectedDevices([]);
    showAlert('success', 'Scene added!');
  };

  const getDevices = () => Object.keys(devices).reduce((acc, d) => {
    if (devices[d].room === room) {
      acc[d] = devices[d];
    }
    return acc;
  }, {});

  const saveDisabled = !selectedScene || !selectedSlot || selectedDevices.length < 1;

  const getScenes = () => {
    if (!govee) {
      return [];
    }
    const goveeRoomScenes = govee.getGoveeRoomScenes(room);
    if (!prefixFilter) {
      return Object.keys(goveeRoomScenes).sort();
    }
    const roomObj = rooms.find((r) => r.key === room);
    const roomPrefix = roomObj.prefix;
    return Object.keys(goveeRoomScenes).filter((s) => s.startsWith(roomPrefix)).sort();
  };

  return (
    <Grid container item xs={12} spacing={0} justifyContent="center" id="page-container">
      <Grid item xs={12} md={10} lg={8} sx={{ position: 'relative' }}>
        <Stack spacing={4}>
          <PageTitle
            title="Add Scene"
            subtitle={getRoomName(room)}
            control={(
              <FormControlLabel
                control={(
                  <Switch
                    checked={prefixFilter}
                    onChange={(e) => setPrefixFilter(e.target.checked)}
                  />
                )}
                label="Prefix Filter"
              />
            )}
          />
          <FormControl fullWidth>
            <InputLabel id="label-scene">Scene</InputLabel>
            <Select
              labelId="label-scene"
              id="select-scene"
              value={selectedScene}
              label="Scene"
              onChange={handleSelectScene}
            >
              {getScenes().map((s) => (
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
                    {sceneSlots[room] ? sceneSlots[room][s] : ''}
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
                Object.keys(getDevices()).sort().map((deviceName) => {
                  const disabled = !devices[deviceName].scenes[selectedScene];
                  return { deviceName, name: deviceName, disabled };
                })
              }
            />
            <List sx={{ display: 'none' }}>
              {Object.keys(getDevices()).sort().map((deviceName) => {
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
};

export default AddScene;
