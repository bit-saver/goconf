import {
  Box, Button,
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

const defaultSlots = [
  'scene', 'sceneTwo', 'sceneThree', 'sceneFour',
  'diyMode', 'diyModeTwo', 'diyModeThree', 'diyModeFour',
  'segmented', 'segmentedTwo', 'segmentedThree', 'segmentedFour',
  'musicMode', 'musicModeTwo', 'musicModeThree', 'musicModeFour',
];

function EditSceneSlots() {
  const { token, apiGetScenes, apiSaveScenes } = useContext(ApiContext);
  const [sceneSlots, setSceneSlots] = useState({});
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    const { data: scenesJson } = await apiGetScenes();
    const configuredSlots = defaultSlots.reduce((acc, slot) => {
      const sceneSlot = scenesJson.find((ss) => ss.slot === slot);
      acc[slot] = sceneSlot?.scene || '';
      return acc;
    }, {});
    setSceneSlots(configuredSlots);
  };

  useEffect(() => {
    if (token) {
      loadConfig().then();
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const config = Object.keys(sceneSlots).reduce((acc, slot) => {
      if (sceneSlots[slot]) {
        acc.push({ slot, scene: sceneSlots[slot] });
      }
      return acc;
    }, []);
    const result = await apiSaveScenes(config);
    console.log('scene slot save result:', result);
    setSaving(false);
  };

  const handleScene = (slot) => (e) => {
    const scene = e.target.value;
    const update = { ...sceneSlots };
    // console.log('slot', slot, 'scene', scene);
    update[slot] = scene;
    setSceneSlots(update);
  };

  return (
    <Grid container item xs={12} spacing={4} justifyContent="center">
      <Grid item xs={12} md={6} lg={4}>
        <Box sx={{ width: '100%' }}>
          <Stack>
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
                  {Object.keys(sceneSlots).map((slot) => {
                    const scene = sceneSlots[slot];
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
        </Box>
      </Grid>
    </Grid>
  );
}

export default EditSceneSlots;
