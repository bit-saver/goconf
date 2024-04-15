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
  FormControl, FormControlLabel,
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
import { useTheme } from '@mui/material/styles';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';
import {
  bulbs, checkSubset, getRoomName, hexToRgb, rgbToHex,
} from '../util/util';
import useCopy from '../util/useCopy';
import AlertContext from '../components/Alert';
import RoomToggle from '../components/RoomToggle';
import PageTitle from '../components/PageTitle';

const LightStates = () => {
  const { defaultSlots, getSceneSlots, room } = useContext(ConfigContext);
  const {
    haGetStates, haCallService, haCallWebhook, apiSaveScenes,
  } = useContext(ApiContext);
  const { showAlert } = useContext(AlertContext);
  const [, copy] = useCopy();

  const [originalStates, setOriginalStates] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [lights, setLights] = useState({ ...bulbs });
  const [sceneSlots, setSceneSlots] = useState([]);
  const [selectedLights, setSelectedLights] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedShowSlot, setSelectedShowSlot] = useState('current');
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const theme = useTheme();

  const getLightStates = async () => {
    const data = await haGetStates()
      .then((result) => result?.data)
      .catch((err) => {
        console.error(err);
        return [];
      });
    Object.keys(bulbs).forEach((entityId) => {
      const state = data.find((d) => d.entity_id === entityId);
      if (state) {
        lights[entityId].state = state.attributes;
      }
    });
    // console.log('updating lights:', lights);
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

  // useEffect(() => {
  //   console.log(sceneSlots);
  // }, [sceneSlots]);

  const getLightsByGroup = () => Object.values(lights).reduce((acc, light) => {
    if (light.room === room) {
      if (!acc[light.group]) {
        acc[light.group] = [];
      }
      acc[light.group].push(light);
    }
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
    await haCallService('light', 'turn_on', attr);
    // const result =
    // console.log('apply result: ', result);
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
    const sceneSlotIndex = sceneSlots.findIndex((ss) => ss.slot === selectedSlot && ss.room === room);
    selectedLights.forEach((eid) => {
      const light = lights[eid];
      const rgb = light.state.rgb_color;
      let ssLightIndex = -1;
      // either add a new light to the sceneSlot.lights or update the existing
      if (removeExisting) {
        sceneSlots[sceneSlotIndex].lights = [];
      } else {
        ssLightIndex = sceneSlots[sceneSlotIndex].lights.findIndex(
          (ssLight) => ssLight.entity_id === eid,
        );
      }
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
    // console.log('updated scene slots', sceneSlots);
    const result = await apiSaveScenes(sceneSlots);
    // console.log('scene slot save result:', result);
    setSaving(false);
    showAlert('success', 'Light states updated!');
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
    const sceneSlot = sceneSlots.find((ss) => ss.slot === selectedShowSlot && ss.room === room);
    if (!sceneSlot) return;
    haCallWebhook('activate_view', { scene: sceneSlot.scene, room }).then(() => {
      showAlert('success', 'Scene activated!');
    }).catch((err) => {
      console.error(err);
      showAlert('error', 'Error activating scene.');
    });
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

  const drawerTop = {
    top: 'calc(calc(56px / 2) - 20px)',
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      top: 'calc(calc(48px / 2) - 20px)',
    },
    [theme.breakpoints.up('sm')]: {
      top: 'calc(calc(64px / 2) - 20px)',
    },
  };

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
        <PageTitle
          title="Light States"
          subtitle={getRoomName(room)}
        />
        <Box sx={{ display: 'block' }}>

          <Drawer
            sx={{
              width: 340,
              flexShrink: 0,
              // height: '100%',
              // overflow: 'auto',
              '& .MuiDrawer-paper': {
                width: 340,
                // marginTop: '56px',
                zIndex: 1100,
                // height: '100%',
                // overflow: 'auto',
              },
            }}
            ModalProps={{
              keepMounted: true,
            }}
            variant="persistent"
            anchor="right"
            open={open}
            className="lightstates-drawer"
          >
            {/* <div> */}
            {/*     <IconButton onClick={() => setOpen(false)}> */}
            {/*         <ChevronRightIcon /> */}
            {/*     </IconButton> */}
            {/* </div> */}
            {/* <Divider /> */}

            <Stack spacing={2}>
              <Card>
                <CardHeader title="Room" />
                <CardContent>
                  <RoomToggle />
                </CardContent>
              </Card>
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
                              (ss) => ss.slot === s && ss.room === room,
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

                    <FormControlLabel
                      control={<Checkbox />}
                      label="Remove existing states?"
                      onChange={(e) => setRemoveExisting(e.target.checked)}
                    />
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
                          const sceneSlot = sceneSlots.find((ss) => ss.slot === s && ss.room === room);
                          return (
                            <MenuItem value={s} key={s}>{`${s}: ${sceneSlot?.scene || ''}`}</MenuItem>
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
              position: 'fixed',
              right: '13px',
              zIndex: 9999,
              ...drawerTop,
            }}
          >
            {open && <ChevronRightIcon />}
            {!open && <SettingsIcon />}
          </Fab>
          <Grid container item spacing={2}>
            <Grid item xs={12} sm={12} md={8}>
              <Grid container item spacing={2}>
                {Object.values(lightGroups).map((group) => {
                  const light = group[0];
                  const fill = getLightFill(light);
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`group-${light.group}`}>
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
                                  key={lightDevice.entity_id}
                                >
                                  <svg
                                    width="100%"
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
                            width: '80%',
                            padding: '25px 1px 1px',
                          }}
                          >
                            <div style={{ position: 'relative' }}>
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
                              <div style={{
                                position: 'absolute',
                                right: '-55px',
                                top: 0,
                                height: '100%',
                                width: '62px',
                                zIndex: 9998,
                                backgroundColor: 'transparent',
                              }}
                              />
                            </div>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Tooltip>
    </Grid>
  );
};

export default LightStates;
