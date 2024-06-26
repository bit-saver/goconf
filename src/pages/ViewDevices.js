import {
  Card, CardHeader, Grid, List, ListItem, ListItemText,
} from '@mui/material';
import React, { useContext } from 'react';
import ConfigContext from '../util/contexts/ConfigContext';
import PageTitle from '../components/PageTitle';

const ViewDevices = () => {
  const { getHb } = useContext(ConfigContext);
  const hb = getHb();

  return (
    <Grid container item spacing={4} xs={12}>
      <Grid item xs={12}>
        <PageTitle
          title="View Devices"
        />
      </Grid>
      {Object.keys(hb.devices).map((deviceName) => {
        const device = hb.devices[deviceName];
        return (
          <Grid item xs={12} sm={4} md={3} lg={2} key={`slots-${deviceName}`}>
            <CardHeader title={deviceName} />
            <Card variant="outlined">
              <List>
                {Object.keys(device.slots).map((slotName) => {
                  const slot = device.slots[slotName];
                  let label = `[${slotName}]`;
                  if (slot) {
                    label = `[${slotName}] ${slot.sceneName}`;
                  }
                  return (
                    <ListItem key={`${device}${slotName}`}>
                      <ListItemText primary={label} />
                    </ListItem>
                  );
                })}
              </List>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ViewDevices;
