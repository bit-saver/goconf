import { AppBar } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';
import { ChevronRight } from '@mui/icons-material';

const TopBar = ({ open, setOpen }) => (
  <AppBar position="fixed" open={open}>
    <Toolbar>
      <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }} component="div">
        GOCONF
      </Typography>
      <IconButton
        color="inherit"
        aria-label="toggle drawer"
        edge="end"
        onClick={() => setOpen(!open)}
        // sx={{ ...(open && { display: 'none' }) }}
      >
        { !open
          ? <MenuIcon />
          : <ChevronRight />}
      </IconButton>
    </Toolbar>
  </AppBar>
);

export default TopBar;
