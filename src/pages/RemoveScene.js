import {
  Button, Card, Grid, List, ListItem, ListItemText, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useContext, useState } from 'react';
import ListTable from '../components/ListTable';
import ApiContext from '../ApiContext';

export default function RemoveScene({ goveeConfig }) {
  const { apiPost, apiPut } = useContext(ApiContext);

  const [selectedSlotScenes, setSelSlotScenes] = useState([]);

  const handleRemove = async () => {
    const { lightDevices } = goveeConfig;
    selectedSlotScenes.forEach(({ slotName, sceneName }) => {
      const devices = goveeConfig.configScenes[slotName][sceneName];
      devices.forEach((deviceName) => {
        const index = lightDevices.findIndex((light) => light.label === deviceName);
        delete lightDevices[index][slotName];
      });
    });
    // console.log(lightDevices);

    const { config } = goveeConfig;
    config.lightDevices = lightDevices;

    await apiPost('/api/config-editor/plugin/homebridge-govee', [config]).then((resp) => resp.json());
    await apiPut('/api/server/restart').then((resp) => resp);
  };

  return (
    <Grid container spacing={4} justifyContent="center">
      <Grid item xs={12} sm={12} md={4} lg={3}>
        <h1>Remove Scenes</h1>
        <Card variant="outlined">
          <ListTable
            selected={selectedSlotScenes}
            setSelected={setSelSlotScenes}
            rows={
            Object.keys(goveeConfig.configScenes).reduce((acc, slotName) => {
              const slotScenes = goveeConfig.configScenes[slotName];
              Object.keys(slotScenes).reduce((acc2, sceneName) => {
                acc2.push({
                  slotName,
                  sceneName,
                  name: `${slotName}-${sceneName}`.replaceAll(' ', '-'),
                });
                return acc2;
              }, acc);
              return acc;
            }, [])
          }
          />
        </Card>
      </Grid>
      <Grid item xs={12} sm={12} md={3} lg={3}>
        <h1>Affected Devices</h1>
        {!!selectedSlotScenes.length && (
          <Stack spacing={2}>
            <Card variant="outlined">
              <List>
                {selectedSlotScenes.map(({ slotName, sceneName }) => {
                  const devices = goveeConfig.configScenes[slotName][sceneName];
                  return (
                    <ListItem key={`${slotName}.${sceneName}`}>
                      <ListItemText
                        id={`slot-scene-devices-${slotName}.${sceneName}`}
                        primary={`[${slotName}] ${sceneName}`}
                        secondary={devices.join(', ')}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Card>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleRemove()}
            >
              REMOVE
            </Button>
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}
