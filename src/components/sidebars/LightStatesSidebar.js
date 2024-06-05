import Drawer from '@mui/material/Drawer';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  useMediaQuery,
} from '@mui/material';
import React, { useContext, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import RoomToggle from '../RoomToggle';
import { defaultSlots } from '../../util/util';
import ConfigContext from '../../util/contexts/ConfigContext';
import ApiContext from '../../util/contexts/ApiContext';
import AlertContext from '../../util/contexts/Alert';

export const lightStatesSidebarWidth = 340;

const LightStatesSidebar = ({
  open, setOpen,
  sceneSlots, setSceneSlots,
  getLightsByGroup,
  showLights, setShowLights,
  lights, setLights,
  selectedLights,
  originalStates,
}) => {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedShowSlot, setSelectedShowSlot] = useState('current');
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { room, goconf } = useContext(ConfigContext);
  const { apiSaveScenes, haCallWebhook } = useContext(ApiContext);
  const { showAlert } = useContext(AlertContext);

  const theme = useTheme();
  const greaterThanSm = useMediaQuery(theme.breakpoints.up('sm'));

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
    goconf.setSceneSlots(sceneSlots);
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

  return (
    <Drawer
      sx={{
        width: lightStatesSidebarWidth,
        flexShrink: 0,
        // height: '100%',
        // overflow: 'auto',
        '& .MuiDrawer-paper': {
          width: lightStatesSidebarWidth,
          // marginTop: '56px',
          zIndex: 1100,
          // height: '100%',
          // overflow: 'auto',
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
      variant={greaterThanSm ? 'permanent' : 'temporary'}
      anchor="right"
      hideBackdrop
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
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
        <Card>
          <CardHeader title="Show/Hide Lights" />
          <CardContent>
            <FormGroup>
              { Object.keys(getLightsByGroup()).map((group) => (
                <FormControlLabel
                  key={`light${Math.random()}`}
                  label={group}
                  control={(
                    <Checkbox
                      checked={showLights.has(group)}
                      onChange={(event) => {
                        const { checked } = event.target;
                        if (checked) {
                          showLights.add(group);
                        } else {
                          showLights.delete(group);
                        }
                        setShowLights(new Set(showLights));
                      }} />
                  )}
                />
              ))}
            </FormGroup>
          </CardContent>
        </Card>
      </Stack>
    </Drawer>
  );
};

export default LightStatesSidebar;
