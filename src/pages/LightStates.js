import React, { useContext, useEffect, useState } from 'react';
import {
    Box, Button,
    Card, CardContent, CardHeader, Checkbox,
    CircularProgress, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField,
} from '@mui/material';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line import/no-extraneous-dependencies
import Colorful from '@uiw/react-color-colorful';
import IconButton from '@mui/material/IconButton';
import RestoreIcon from '@mui/icons-material/Restore';
import CheckIcon from '@mui/icons-material/Check';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';

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

const rgbToHex = (rgbColor) => {
    // Choose correct separator
    const sep = ', ';
    // Turn "rgb(r,g,b)" into [r,g,b]
    const rgb = rgbColor.split(sep);

    let r = (+rgb[0]).toString(16);
    let g = (+rgb[1]).toString(16);
    let b = (+rgb[2]).toString(16);

    if (r.length === 1) r = `0${r}`;
    if (g.length === 1) g = `0${g}`;
    if (b.length === 1) b = `0${b}`;

    return `#${r}${g}${b}`;
};

const hexToRgb = (hex) => {
    let r = 0;
    let g = 0;
    let b = 0;

    // 3 digits
    if (hex.length === 4) {
        r = `0x${hex[1]}${hex[1]}`;
        g = `0x${hex[2]}${hex[2]}`;
        b = `0x${hex[3]}${hex[3]}`;

    // 6 digits
    } else if (hex.length === 7) {
        r = `0x${hex[1]}${hex[2]}`;
        g = `0x${hex[3]}${hex[4]}`;
        b = `0x${hex[5]}${hex[6]}`;
    }

    return [+r, +g, +b];
};

// eslint-disable-next-line max-len
const checkSubset = (parentArray, subsetArray) => subsetArray.some((el) => parentArray.includes(el));

export default function LightStates() {
    const { defaultSlots, getSceneSlots } = useContext(ConfigContext);
    const { haGetStates, haCallService, apiSaveScenes } = useContext(ApiContext);
    const [originalStates, setOriginalStates] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [lights, setLights] = useState({ ...devices });
    const [sceneSlots, setSceneSlots] = useState({});
    const [selectedLights, setSelectedLights] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [saving, setSaving] = useState(false);

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
        return <CircularProgress />;
    }
    const lightGroups = getLightsByGroup();
    return (
        <Grid item xs={12}>
            <Typography
                variant="h5"
                noWrap
                sx={{
                    flexGrow: 1,
                    margin: '15px 0',
                }}
                component="div"
            >
                Light States
            </Typography>
            <Grid container item spacing={2}>
                <Grid item xs={8}>
                    <Grid container item spacing={2}>
                        {Object.values(lightGroups).map((group) => {
                            const light = group[0];
                            const fill = getLightFill(light);
                            return (
                                <Grid item xs={6} sm={4} md={3} lg={2}>
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
                                                onClick={() => handleLightCheck(light.entity_id)}
                                            >
                                                {light.group}
                                            </Typography>
                                            {group.map((lightDevice) => {
                                                const lightFill = getLightFill(lightDevice);
                                                return (
                                                    <svg height="100" width="100">
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            stroke="transparent"
                                                            strokeWidth="1"
                                                            fill={`rgb(${lightFill})`}
                                                        />
                                                    </svg>
                                                );
                                            })}
                                            <Stack direction="row">
                                                <TextField
                                                    hiddenLabel
                                                    id={light.group}
                                                    variant="filled"
                                                    size="small"
                                                    value={fill}
                                                    sx={{ textAlign: 'center' }}
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
                <Grid item xs={4}>
                    <Stack>
                        <Card>
                            <CardHeader title="Save to Slot" />
                            <CardContent>
                                <Stack>
                                    Selected:
                                    <ul>
                                        {
                                            getSelectedGroups().map((group) => (
                                                <li>{ group[0].group }</li>
                                            ))
                                        }
                                    </ul>

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
                </Grid>
            </Grid>
        </Grid>
    );
}
