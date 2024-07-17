import {
  Card, CardHeader, FormControl, Grid, InputLabel, List, ListItem, ListItemText, MenuItem, Select,
} from '@mui/material';
import React, { useContext, useState } from 'react';
import ConfigContext from '../util/contexts/ConfigContext';
import PageTitle from '../components/PageTitle';

const ViewDevices = () => {
  const { getHb } = useContext(ConfigContext);
  const hb = getHb();

  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <Grid container item spacing={4} xs={12}>
      <Grid item xs={12}>
        <PageTitle
          title="View Devices"
        />
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Grid item xs={12} sm={8} md={8} lg={6}>
            <FormControl fullWidth>
              <InputLabel id="label-device">Device</InputLabel>
              <Select
                labelId="label-device"
                id="select-device"
                value={selectedDevice}
                label="Device"
                fullWidth
                placeholder="Select Device"
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                {Object.keys(hb.devices).map((device) => (
                  <MenuItem value={device} key={device}>
                    { device }
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {selectedDevice && (
          <Grid item xs={12} sm={8} md={8} lg={6} key={`slots-${selectedDevice}`}>
            <CardHeader title={selectedDevice} />
            <Card variant="outlined">
              <List>
                {Object.keys(hb.devices[selectedDevice].slots).map((slotName) => {
                  const slot = hb.devices[selectedDevice].slots[slotName];
                  let label = `[${slotName}]`;
                  if (slot) {
                    label = `[${slotName}] ${slot.sceneName}`;
                  }
                  return (
                    <ListItem key={`${selectedDevice}${slotName}`}>
                      <ListItemText primary={label} />
                    </ListItem>
                  );
                })}
              </List>
            </Card>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default ViewDevices;
