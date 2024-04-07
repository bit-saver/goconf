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
// import AlertContext from '../components/Alert';
import { getRoomName } from '../util/util';

const EditSceneSlots = () => {
  const { getSceneSlots, getRoomSlots, room } = useContext(ConfigContext);
  const { token, apiSaveScenes } = useContext(ApiContext);
  // const { showAlert } = useContext(AlertContext);
  const [sceneSlots, setSceneSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      getSceneSlots().then((result) => setSceneSlots(result));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await apiSaveScenes(sceneSlots);
    console.log('scene slot save result:', result);
    setSaving(false);
    // showAlert('success', 'Slots updated!');
  };

  const handleScene = (sceneSlot) => (e) => {
    const scene = e.target.value;
    const update = [...sceneSlots];
    // console.log('slot', slot, 'scene', scene);
    const index = update.findIndex(
      (ss) => ss.slot === sceneSlot.slot && ss.room === sceneSlot.room,
    );
    update[index].scene = scene;
    setSceneSlots(update);
  };

  return (
    <Grid container item xs={12} spacing={4} justifyContent="center">
      <Grid item xs={12} md={6} lg={4}>
        <h1>
          {`Edit Scene Slots: ${getRoomName(room)}`}
        </h1>
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
                      align="left"
                      padding="normal"
                      sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                    >
                      Slot
                    </TableCell>
                    <TableCell
                      align="left"
                      padding="normal"
                      sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                    >
                      Scene
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getRoomSlots().map((sceneSlot) => {
                    const { slot, scene, room: sceneRoom } = sceneSlot;
                    const labelId = `scene-slot-${room}-${slot}`;
                    return (
                      <TableRow
                        hover
                        key={`${sceneRoom}-${slot}`}
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
                              value={scene || ''}
                              onChange={handleScene(sceneSlot)}
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
};

export default EditSceneSlots;
