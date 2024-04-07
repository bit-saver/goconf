import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useContext } from 'react';
import { rooms } from '../util/util';
import ConfigContext from '../util/ConfigContext';

const RoomToggle = ({ onToggleChange }) => {
  const { room, setRoom } = useContext(ConfigContext);
  const handleToggleChange = (event, value) => {
    setRoom(value);
    if (onToggleChange) {
      onToggleChange();
    }
  };
  return (
    <ToggleButtonGroup
      value={room}
      exclusive
      onChange={handleToggleChange}
      sx={{ justifyContent: 'center' }}
      size="small"
    >
      { rooms.map((r) => (
        <ToggleButton value={r.key} key={r.key}>
          {r.name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default RoomToggle;
