import {
  Button, Card, Grid, List, ListItem, ListItemText, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useContext, useState } from 'react';
import ListTable from '../components/ListTable';
import ApiContext from '../util/contexts/ApiContext';
import ConfigContext from '../util/contexts/ConfigContext';
import AlertContext from '../util/contexts/Alert';
import PageTitle from '../components/PageTitle';

const RemoveScene = () => {
  const { apiPost, apiPut } = useContext(ApiContext);
  const { getHb } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);

  const [selectedSlotScenes, setSelSlotScenes] = useState([]);

  const hb = getHb();

  const handleRemove = async () => {
    const { pluginConfig } = hb;
    const { lightDevices } = pluginConfig;
    if (!lightDevices) {
      console.error('no light devices');
      return;
    }
    selectedSlotScenes.forEach(({ slotName, sceneName }) => {
      const devices = hb.scenes[slotName][sceneName];
      devices.forEach((deviceName) => {
        const index = lightDevices.findIndex((light) => light.label === deviceName);
        delete lightDevices[index][slotName];
      });
    });
    // console.log(lightDevices);
    hb.pluginConfig.lightDevices = lightDevices;

    await apiPost('/api/config-editor/plugin/homebridge-govee', [hb.pluginConfig]).then((resp) => resp);
    await apiPut('/api/server/restart').then((resp) => resp);
    showAlert('success', 'Scene removed!');
  };

  return (
    <Grid container item xs={12} spacing={4} justifyContent="center">
      <Grid item xs={12} sm={12} md={4} lg={3}>
        <PageTitle
          title="Remove Scenes"
        />
        <Card variant="outlined">
          <ListTable
            selected={selectedSlotScenes}
            setSelected={setSelSlotScenes}
            rows={
              Object.keys(hb.scenes).reduce((acc, slotName) => {
                const slotScenes = hb.scenes[slotName];
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
                  const devices = hb.scenes[slotName][sceneName];
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
};

export default RemoveScene;
