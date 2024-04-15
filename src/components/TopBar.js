import { AppBar } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';
import { ChevronLeft } from '@mui/icons-material';

const TopBar = ({ open, setOpen }) => (
  <AppBar position="fixed" open={open}>
    <Toolbar>
      <IconButton
        color="inherit"
        aria-label="toggle drawer"
        edge="start"
        onClick={() => setOpen(!open)}
        // sx={{ ...(open && { display: 'none' }) }}
      >
        { !open
          ? <MenuIcon />
          : <ChevronLeft />}
      </IconButton>
      <Typography variant="h6" noWrap sx={{ flexGrow: 1, marginLeft: '10px' }} component="div">
        Govee Config Editor
      </Typography>
    </Toolbar>
  </AppBar>
);

export default TopBar;
