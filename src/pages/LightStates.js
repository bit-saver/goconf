import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Fab,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line import/no-extraneous-dependencies
import Colorful from '@uiw/react-color-colorful';
import IconButton from '@mui/material/IconButton';
import RestoreIcon from '@mui/icons-material/Restore';
import CheckIcon from '@mui/icons-material/Check';
import Drawer from '@mui/material/Drawer';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';
import { checkSubset, hexToRgb, rgbToHex } from '../util/util';
import useCopy from '../util/useCopy';

const devices = {
  'light.lamp': {
    label: 'Lamp', entity_id: 'light.lamp', state: null, group: 'Lamp',
  },
  'light.kitchen_1': {
    label: 'Kitchen 1', entity_id: 'light.kitchen_1', state: null, group: 'Balcony',
  },
  'light.kitchen_2': {
    label: 'Kitchen 2', entity_id: 'light.kitchen_2', state: null, group: 'Balcony',
  },
  'light.sink_1': {
    label: 'Sink 1', entity_id: 'light.sink_1', state: null, group: 'Sink',
  },
  'light.sink_2': {
    label: 'Sink 2', entity_id: 'light.sink_2', state: null, group: 'Sink',
  },
  'light.door_1': {
    label: 'Door 1', entity_id: 'light.door_1', state: null, group: 'Door',
  },
  'light.door_2': {
    label: 'Door 2', entity_id: 'light.door_2', state: null, group: 'Door',
  },
  'light.hall_1': {
    label: 'Hall 1', entity_id: 'light.hall_1', state: null, group: 'Hall',
  },
  'light.hall_2': {
    label: 'Hall 2', entity_id: 'light.hall_2', state: null, group: 'Hall',
  },
  'light.office_1': {
    label: 'Office 1', entity_id: 'light.office_1', state: null, group: 'Office',
  },
  'light.office_2': {
    label: 'Office 2', entity_id: 'light.office_2', state: null, group: 'Office',
  },
  'light.office_3': {
    label: 'Office 3', entity_id: 'light.office_3', state: null, group: 'Office',
  },
};

export default function LightStates() {
  const { defaultSlots, getSceneSlots } = useContext(ConfigContext);
  const {
    haGetStates, haCallService, haCallWebhook, apiSaveScenes,
  } = useContext(ApiContext);
  const [, copy] = useCopy();

  const [originalStates, setOriginalStates] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [lights, setLights] = useState({ ...devices });
  const [sceneSlots, setSceneSlots] = useState([]);
  const [selectedLights, setSelectedLights] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedShowSlot, setSelectedShowSlot] = useState('current');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const getLightStates = async () => {
    const data = await haGetStates()
      .then((result) => result?.data)
      .catch((err) => {
        console.error(err);
        return [];
      });
    Object.keys(devices).forEach((entityId) => {
      const state = data.find((d) => d.entity_id === entityId);
      if (state) {
        lights[entityId].state = state.attributes;
      }
    });
    console.log('updating lights:', lights);
    setLights({ ...lights });
  };

  useEffect(() => {
    getLightStates().then(() => {
      setLoaded(true);
      const original = Object.values(lights).reduce((acc, light) => {
        acc[light.entity_id] = { ...light, state: { ...light.state } };
        return acc;
      }, {});
      setOriginalStates(original);
    });
    getSceneSlots().then((result) => setSceneSlots(result));
  }, []);

  useEffect(() => {
    console.log(sceneSlots);
  }, [sceneSlots]);

  const getLightsByGroup = () => Object.values(lights).reduce((acc, light) => {
    if (!acc[light.group]) {
      acc[light.group] = [];
    }
    acc[light.group].push(light);
    return acc;
  }, {});

  const updateLightState = (light, rgb = null) => {
    const updated = { ...lights };
    updated[light.entity_id].state = { ...light.state };
    if (rgb) {
      updated[light.entity_id].state.rgb_color = rgb;
    }
    setLights(updated);
  };

  const restoreGroup = (group) => {
    const updated = { ...lights };
    group.forEach((light) => {
      updated[light.entity_id] = { ...originalStates[light.entity_id] };
      updated[light.entity_id].state = { ...originalStates[light.entity_id].state };
    });
    setLights(updated);
  };

  const applyColor = async (group) => {
    const entityIds = group.map((light) => light.entity_id);
    const attr = {
      entity_id: entityIds,
      brightness: 255,
      rgb_color: group[0].state.rgb_color,
    };
    const result = await haCallService('light', 'turn_on', attr);
    console.log('apply result: ', result);
  };

  const handleLightCheck = (groupId) => {
    const groups = getLightsByGroup();
    const groupEIDs = groups[groupId].map((l) => l.entity_id);
    const uncheck = checkSubset(selectedLights, groupEIDs);
    if (uncheck) {
      setSelectedLights([...selectedLights.filter((e) => !groupEIDs.includes(e))]);
    } else {
      setSelectedLights([...selectedLights, ...groupEIDs]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (!selectedSlot || !selectedLights || !selectedLights.length) {
      setSaving(false);
      return false;
    }
    const sceneSlotIndex = sceneSlots.findIndex((ss) => ss.slot === selectedSlot);
    selectedLights.forEach((eid) => {
      const light = lights[eid];
      const rgb = light.state.rgb_color;
      // either add a new light to the sceneSlot.lights or update the existing
      const ssLightIndex = sceneSlots[sceneSlotIndex].lights.findIndex(
        (ssLight) => ssLight.entity_id === eid,
      );
      if (ssLightIndex > -1) {
        sceneSlots[sceneSlotIndex].lights[ssLightIndex].rgb_color = rgb;
      } else {
        sceneSlots[sceneSlotIndex].lights.push({
          entity_id: eid,
          brightness: 255,
          rgb_color: rgb,
        });
      }
    });
    setSceneSlots([...sceneSlots]);
    const result = await apiSaveScenes(sceneSlots);
    console.log('scene slot save result:', result);
    setSaving(false);
    return result;
  };

  const handleLoadSlot = () => {
    if (selectedShowSlot === 'current') {
      const updated = Object.values(originalStates).reduce((acc, light) => {
        acc[light.entity_id] = { ...light, state: { ...light.state } };
        return acc;
      }, {});
      setLights(updated);
      return;
    }
    const sceneSlot = sceneSlots.find((ss) => ss.slot === selectedShowSlot);
    const updated = { ...lights };
    Object.keys(updated).forEach((eid) => {
      let ssLight = null;
      if (sceneSlot?.lights?.length) {
        ssLight = sceneSlot.lights.find((ssl) => ssl.entity_id === eid);
      }
      if (ssLight) {
        updated[eid].state.rgb_color = ssLight.rgb_color;
      } else {
        updated[eid].state.rgb_color = [0, 0, 0];
      }
    });
    setLights(updated);
  };

  const handleActivateScene = () => {
    const sceneSlot = sceneSlots.find((ss) => ss.slot === selectedShowSlot);
    if (!sceneSlot) return;
    haCallWebhook('activate_view', { scene: sceneSlot.scene }).then().catch((err) => console.error(err));
  };

  const handleCopy = (rgb) => {
    copy(rgb).then();
    setShowTooltip(true);
    // eslint-disable-next-line max-len
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const handleClick = (e) => {
    e.target.select();
  };

  const handleLightChange = (group) => (e) => {
    const rgbStr = e.target.value;
    const rgb = rgbStr.split(', ');
    if (rgb.length !== 3 || !rgb[0] || !rgb[1] || !rgb[2]) {
      return;
    }
    group.forEach((light) => updateLightState(light, rgb));
  };

  const getSelectedGroups = () => {
    const groups = selectedLights.reduce((acc, eid) => {
      const light = lights[eid];
      if (!acc[light.group]) {
        acc[light.group] = [];
      }
      acc[light.group].push(light);
      return acc;
    }, {});
    return Object.values(groups);
  };

  const getLightFill = (light) => (light.state?.rgb_color ? `${light.state.rgb_color.join(', ')}` : '0, 0, 0');

  if (!loaded) {
    return <Grid item xs={12} sx={{ textAlign: 'center', marginTop: '30vh' }}><CircularProgress /></Grid>;
  }
  const lightGroups = getLightsByGroup();
  return (
    <Grid item xs={12}>
      <Tooltip
        open={showTooltip}
        title="Copied!"
        followCursor
        PopperProps={{
          disablePortal: true,
        }}
        onClose={
          () => setShowTooltip(false)
        }
        disableFocusListener
        disableHoverListener
        disableTouchListener
      >
        <Typography
          variant="h5"
          component="div"
          noWrap
          sx={{
            flexGrow: 1,
            margin: '15px 0',
          }}
        >
          Light States
        </Typography>

        <Drawer
          sx={{
            width: 340,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 340,
              marginTop: '64px',
              zIndex: 1100,
            },
          }}
          variant="persistent"
          anchor="right"
          open={open}
        >
          {/* <div> */}
          {/*     <IconButton onClick={() => setOpen(false)}> */}
          {/*         <ChevronRightIcon /> */}
          {/*     </IconButton> */}
          {/* </div> */}
          {/* <Divider /> */}

          <Stack spacing={2}>
            <Card>
              <CardHeader title="Load/Activate States" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="label-show-slot">Slot</InputLabel>
                    <Select
                      labelId="label-show-slot"
                      id="select-show-slot"
                      value={selectedShowSlot}
                      label="Slot"
                      onChange={(e) => setSelectedShowSlot(e.target.value)}
                    >
                      <MenuItem value="current" key="current">Current</MenuItem>
                      {defaultSlots.map((s) => {
                        // eslint-disable-next-line max-len
                        let sceneSlot = null;
                        if (sceneSlots && sceneSlots.length) {
                          sceneSlot = sceneSlots.find(
                            (ss) => ss.slot === s,
                          );
                        }
                        return (
                          <MenuItem value={s} key={s}>{`${s}: ${sceneSlot?.scene || ''}`}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                  <Stack spacing={1} direction="row" justifyContent="space-between">
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={handleActivateScene}
                      sx={{ width: '50%' }}
                    >
                      Activate Scene
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleLoadSlot}
                      sx={{ width: '50%' }}
                    >
                      Load States
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Save to Slot" />
              <CardContent>
                <Stack spacing={1}>
                  <div style={{ marginBottom: '15px' }}>
                    Selected:
                    <ul>
                      {
                        getSelectedGroups().map((group) => (
                          <li>{ group[0].group }</li>
                        ))
                      }
                    </ul>
                  </div>

                  <FormControl fullWidth>
                    <InputLabel id="label-slot">Slot</InputLabel>
                    <Select
                      labelId="label-slot"
                      id="select-slot"
                      value={selectedSlot}
                      label="Slot"
                      onChange={(e) => setSelectedSlot(e.target.value)}
                    >
                      {defaultSlots.map((s) => {
                        // eslint-disable-next-line max-len
                        const sceneSlot = sceneSlots.find((ss) => ss.slot === s);
                        return (
                          <MenuItem value={s} key={s}>{`${s}: ${sceneSlot.scene || ''}`}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color={saving ? 'primary' : 'success'}
                    disabled={saving}
                    size="large"
                    onClick={handleSave}
                  >
                    { saving ? 'SAVING...' : 'SAVE'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Drawer>
        <Fab
          color={open ? '' : 'primary'}
          size="small"
          onClick={() => setOpen(!open)}
          sx={{
            position: 'fixed', top: '65px', right: '13px', zIndex: 1101,
          }}
        >
          {open && <ChevronRightIcon />}
          {!open && <SettingsIcon />}
        </Fab>
        <Grid container item spacing={2}>
          <Grid item xs={12} sm={8}>
            <Grid container item spacing={2}>
              {Object.values(lightGroups).map((group) => {
                const light = group[0];
                const fill = getLightFill(light);
                return (
                  <Grid item xs={12} sm={4} md={3} lg={2} key={`group-${light.group}`}>
                    <Paper
                      square={false}
                      elevation={3}
                      sx={{
                        textAlign: 'center',
                        justifyContent: 'center',
                        padding: '15px 10px 20px',
                        position: 'relative',
                      }}
                    >
                      <Checkbox
                        sx={{
                          position: 'absolute',
                          top: 9,
                          left: 5,
                        }}
                        onChange={() => handleLightCheck(light.group)}
                        checked={selectedLights.includes(light.entity_id)}
                      />
                      <IconButton
                        aria-label="restore"
                        sx={{
                          position: 'absolute',
                          top: 9,
                          right: 5,
                        }}
                        onClick={() => restoreGroup(group)}
                      >
                        <RestoreIcon />
                      </IconButton>
                      <Stack alignItems="center">
                        <Typography
                          variant="h6"
                          noWrap
                          sx={{
                            flexGrow: 1,
                            cursor: 'pointer',
                          }}
                          component="div"
                          onClick={
                            () => handleLightCheck(light.entity_id)
                          }
                        >
                          {light.group}
                        </Typography>
                        <Grid container justifyContent="center">
                          {group.map((lightDevice) => {
                            const lightFill = getLightFill(lightDevice);
                            return (
                              <Grid
                                item
                                xs={6}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                  handleCopy(lightFill);
                                }}
                              >
                                <svg
                                  width="100%"
                                  height="auto"
                                  viewBox="0 0 100 100"
                                  key={lightDevice.entity_id}
                                >
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="transparent"
                                    strokeWidth="1"
                                    fill={`rgb(${lightFill})`}
                                  />
                                </svg>
                              </Grid>
                            );
                          })}
                        </Grid>
                        <Stack direction="row">
                          <TextField
                            hiddenLabel
                            id={light.group}
                            variant="filled"
                            size="small"
                            value={fill}
                            sx={{ textAlign: 'center' }}
                            onClick={handleClick}
                            onChange={handleLightChange(group)}
                          />
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="apply"
                            variant="outlined"
                            onClick={() => applyColor(group)}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Stack>
                        <Box sx={{
                          width: '100%',
                          padding: '25px 1px 1px',
                        }}
                        >
                          <Colorful
                            color={rgbToHex(fill)}
                            disableAlpha
                            onChange={(color) => {
                              const rgb = hexToRgb(color.hex);
                              group.forEach((ld) => {
                                updateLightState(ld, rgb);
                              });
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          <Grid item xs={12} sm={4} />
        </Grid>
      </Tooltip>
    </Grid>
  );
}
