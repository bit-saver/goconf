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
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
// import AlertContext from '../components/Alert';
import { getRoomName } from '../util/util';
import PageTitle from '../components/PageTitle';

const EditSceneSlots = () => {
  const { getGoconf, room } = useContext(ConfigContext);
  const { tokenRef, apiSaveScenes } = useContext(ApiContext);
  // const { showAlert } = useContext(AlertContext);
  const [sceneSlots, setSceneSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const goconf = getGoconf();

  useEffect(() => {
    if (tokenRef.current) {
      goconf.reload().then((result) => setSceneSlots(result));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await apiSaveScenes(sceneSlots);
    console.log('scene slot save result:', result);
    goconf.setSceneSlots(sceneSlots);
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

  const roomSlots = goconf.getRoomSlots(room);

  return (
    <Grid container item xs={12} spacing={4} justifyContent="center">
      <Grid item xs={12} md={6} lg={4}>
        <PageTitle
          title="Edit Scene Slots"
          subtitle={getRoomName(room)}
        />
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
                  {roomSlots.map((sceneSlot) => {
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
