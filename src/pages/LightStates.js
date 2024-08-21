import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Checkbox, CircularProgress, Fab, Grid, Paper, Stack, TextField, useMediaQuery,
} from '@mui/material';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line import/no-extraneous-dependencies
import Colorful from '@uiw/react-color-colorful';
import IconButton from '@mui/material/IconButton';
import RestoreIcon from '@mui/icons-material/Restore';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTheme } from '@mui/material/styles';
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
import {
  bulbs, checkSubset, getRoomName, hexToRgb, rgbToHex,
} from '../util/util';
import useCopy from '../util/useCopy';
import PageTitle from '../components/PageTitle';
import LightStatesSidebar, { lightStatesSidebarWidth } from '../components/sidebars/LightStatesSidebar';
import AlertContext from '../util/contexts/Alert';

const LightStates = () => {
  const { room, getGoconf } = useContext(ConfigContext);
  const {
    haGetStates, haCallService,
  } = useContext(ApiContext);
  const { showAlert } = useContext(AlertContext);

  const [, copy] = useCopy();

  const goconf = getGoconf();

  const preferedLights = {
    living_room: new Set(['Sink', 'Balcony']),
    office: new Set(['Office Fan']),
    bedroom: new Set([]),
    hallway: new Set(['Door', 'Hall']),
  };

  const [originalStates, setOriginalStates] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [lights, setLights] = useState({ ...bulbs });
  const [sceneSlots, setSceneSlots] = useState([]);
  const [selectedLights, setSelectedLights] = useState([]);
  const [showLights, setShowLights] = useState(preferedLights[room]);
  const [open, setOpen] = useState(true);

  const theme = useTheme();
  // const greaterThanSm = useMediaQuery(theme.breakpoints.up('sm'));
  const greaterThanMd = useMediaQuery(theme.breakpoints.up('md'));

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
    if (!goconf) {
      console.error('goconf is null');
      return;
    }
    goconf.reload().then((result) => setSceneSlots(result));
  }, []);

  const getLightsByGroup = () => Object.values(lights).reduce((acc, light) => {
    if (light.room === room) {
      if (!acc[light.group]) {
        acc[light.group] = [];
      }
      acc[light.group].push(light);
    }
    return acc;
  }, {});

  useEffect(() => {
    setShowLights(preferedLights[room]);
    const groups = getLightsByGroup();
    const groupEIDs = Array.from(preferedLights[room]).reduce((acc, groupId) => {
      acc.push(...groups[groupId].map((l) => l.entity_id));
      return acc;
    }, []);
    setSelectedLights(groupEIDs);
  }, [room]);

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
  };

  const setShowTooltip = () => {
    showAlert('info', 'Copied!');
  };

  const handleCopy = (rgb) => {
    copy(rgb).then();
    setShowTooltip();
  };

  const handleClick = (e) => {
    e.target.select();
  };

  const handleLightCheck = (groupId, toggle = null) => {
    console.log('group', groupId);
    const groups = getLightsByGroup();
    const groupEIDs = groups[groupId].map((l) => l.entity_id);
    let uncheck = !toggle;
    if (toggle === null) {
      uncheck = checkSubset(selectedLights, groupEIDs);
    }
    if (uncheck) {
      setSelectedLights([...selectedLights.filter((e) => !groupEIDs.includes(e))]);
    } else {
      setSelectedLights([...selectedLights, ...groupEIDs]);
    }
  };

  const handleLightChange = (group) => (e) => {
    const rgbStr = e.target.value;
    const rgb = rgbStr.split(', ');
    if (rgb.length !== 3 || !rgb[0] || !rgb[1] || !rgb[2]) {
      return;
    }
    group.forEach((light) => updateLightState(light, rgb));
  };

  const getLightFill = (light) => (light.state?.rgb_color ? `${light.state.rgb_color.join(', ')}` : '0, 0, 0');

  if (!loaded) {
    return <Grid item xs={12} sx={{ textAlign: 'center', marginTop: '30vh' }}><CircularProgress /></Grid>;
  }
  const lightGroups = getLightsByGroup();

  return (
    <Grid
      item
      xs={12}
      sx={{
        // [theme.breakpoints.up('sm')]: { marginRight: `${lightStatesSidebarWidth}px` },
        [theme.breakpoints.up('md')]: { marginRight: `${lightStatesSidebarWidth}px` },
      }}
    >
      <PageTitle
        title="Light States"
        subtitle={getRoomName(room)}
      />
      <Box sx={{ display: 'block' }}>
        <LightStatesSidebar
          open={open}
          setOpen={setOpen}
          sceneSlots={sceneSlots}
          setSceneSlots={setSceneSlots}
          getLightsByGroup={getLightsByGroup}
          showLights={showLights}
          setShowLights={setShowLights}
          lights={lights}
          setLights={setLights}
          selectedLights={selectedLights}
          originalStates={originalStates}
        />
        <Fab
          color={open ? '' : 'primary'}
          size="small"
          onClick={() => setOpen(!open)}
          sx={{
            display: greaterThanMd ? 'none' : 'inline-flex',
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 9999,
            // ...drawerTop,
          }}
        >
          {open && <ChevronRightIcon />}
          {!open && <SettingsIcon />}
        </Fab>
        <Grid
          container
          item
          spacing={2}
          className="lights-container"
        >
          <Grid item xs={12} sm={12} md={12}>
            <Grid container item spacing={2}>
              {Object.values(lightGroups).filter((g) => showLights.has(g[0].group)).map((group) => {
                const light = group[0];
                const fill = getLightFill(light);
                return (
                  <Grid item xs={12} sm={12} md={12} lg={6} key={`group-${light.group}`}>
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
    </Grid>
  );
};

export default LightStates;
