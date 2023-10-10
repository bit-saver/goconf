import {
    Button, Card,
    FormControl, Grid, Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import ApiContext from '../util/ApiContext';
import ConfigContext from '../util/ConfigContext';

function EditSceneSlots() {
    const { getSceneSlots } = useContext(ConfigContext);
    const { token, apiSaveScenes } = useContext(ApiContext);
    const [sceneSlots, setSceneSlots] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token) {
            getSceneSlots().then((result) => setSceneSlots(result));
        }
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // const config = Object.keys(sceneSlots).reduce((acc, slot) => {
        //     if (sceneSlots[slot]) {
        //         acc.push({ slot, scene: sceneSlots[slot] });
        //     }
        //     return acc;
        // }, []);
        const result = await apiSaveScenes(sceneSlots);
        console.log('scene slot save result:', result);
        setSaving(false);
    };

    const handleScene = (slot) => (e) => {
        const scene = e.target.value;
        const update = [...sceneSlots];
        // console.log('slot', slot, 'scene', scene);
        const index = update.findIndex((ss) => ss.slot === slot);
        update[index].scene = scene;
        setSceneSlots(update);
    };

    return (
        <Grid container item xs={12} spacing={4} justifyContent="center">
            <Grid item xs={12} md={6} lg={4}>
                <h1>Edit Scene Slots</h1>
                <Card variant="outlined">
                    <Stack spacing={4}>
                        <TableContainer>
                            <Table
                                aria-labelledby="tableTitle"
                                size="medium"
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            key="th-slot"
                                            align="left"
                                            padding="normal"
                                            sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                                        >
                                            Slot
                                        </TableCell>
                                        <TableCell
                                            key="th-scene"
                                            align="left"
                                            padding="normal"
                                            sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                                        >
                                            Scene
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sceneSlots.map((sceneSlot) => {
                                        const { slot, scene } = sceneSlot;
                                        const labelId = `scene-slot-${slot}`;
                                        return (
                                            <TableRow
                                                hover
                                                key={slot}
                                            >
                                                <TableCell
                                                    component="th"
                                                    id={labelId}
                                                    scope="row"
                                                    padding="normal"
                                                    sx={{ borderBottom: 'none', fontSize: '0.99rem', width: '100px' }}
                                                >
                                                    {slot}
                                                </TableCell>
                                                <TableCell
                                                    padding="normal"
                                                    sx={{ borderBottom: 'none' }}
                                                >
                                                    <FormControl fullWidth>
                                                        <TextField
                                                            size="small"
                                                            value={scene}
                                                            onChange={handleScene(slot)}
                                                        />
                                                    </FormControl>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                </Card>
            </Grid>
        </Grid>
    );
}

export default EditSceneSlots;
