import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useContext } from 'react';
import { rooms } from '../util/util';
import ConfigContext from '../util/contexts/ConfigContext';

const RoomToggle = ({ onToggleChange }) => {
  const { room, setRoom } = useContext(ConfigContext);
  const handleToggleChange = (event, value) => {
    setRoom(value);
    if (onToggleChange) {
      onToggleChange();
    }
  };
  return (
    <Box padding="10px" sx={{ textAlign: 'center' }}>
      <ToggleButtonGroup
        value={room}
        exclusive
        onChange={handleToggleChange}
        sx={{ justifyContent: 'center', width: '100%' }}
        size="small"
        orientation="vertical"
      >
        { rooms.map((r) => (
          <ToggleButton value={r.key} key={r.key}>
            {r.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default RoomToggle;
