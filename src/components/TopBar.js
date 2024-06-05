import { AppBar, useMediaQuery } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';
import { ChevronRight } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const TopBar = ({ open, setOpen }) => {
  const location = useLocation();
  const isLoginPage = location.pathname.startsWith('/login');

  const theme = useTheme();
  const greaterThanSm = useMediaQuery(theme.breakpoints.up('sm'));
  const showMenuIcon = !greaterThanSm && !isLoginPage;
  return (
    <AppBar position="fixed" open={open}>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }} component="div">
          Goconf
        </Typography>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="end"
          onClick={() => setOpen(!open)}
          // sx={{ ...(open && { display: 'none' }) }}
        >
          { showMenuIcon && (!open
            ? <MenuIcon />
            : <ChevronRight />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
