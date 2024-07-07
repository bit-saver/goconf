import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { getDevicesByRoom } from '../util/util';

const DeviceList = ({ sceneSlot, room }) => {
  const hasName = (a, b) => a.includes(b) || b.includes(a);

  const configured = sceneSlot.devices.map((ssd) => ssd.device);
  const missing = getDevicesByRoom(room).filter((device) => !configured.includes(device));
  const misMatched = sceneSlot.devices
    .filter((ssd) => ssd.diyName && !hasName(ssd.diyName, sceneSlot.scene))
    .map((ssd) => ssd.device);

  return (
    <List dense disablePadding sx={{ columns: 2 }}>
      {configured.map((device) => (
        <ListItem key={Math.random()} sx={{ paddingTop: 0, paddingBottom: 0 }}>
          <ListItemText
            sx={{ marginTop: 0, marginBottom: 0 }}
            primaryTypographyProps={{ color: misMatched.includes(device) ? 'yellow' : '#fff' }}
          >
            {device}
          </ListItemText>
        </ListItem>
      ))}
      {missing.map((device) => (
        <ListItem key={Math.random()} sx={{ paddingTop: 0, paddingBottom: 0 }}>
          <ListItemText
            sx={{ marginTop: 0, marginBottom: 0 }}
            primaryTypographyProps={{ color: 'error' }}
          >
            {device}
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
};

export default DeviceList;
