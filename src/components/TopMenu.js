import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box, Button, CircularProgress, SwipeableDrawer,
} from '@mui/material';
import List from '@mui/material/List';
import { Link } from 'react-router-dom';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { RestartAlt } from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import React, { useContext } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import ConfigContext from '../util/ConfigContext';
import AlertContext from './Alert';
import RoomToggle from './RoomToggle';

const drawerWidth = 280;

const TopMenu = ({ open, setOpen }) => {
  const { showAlert } = useContext(AlertContext);
  const {
    restarting, loaded,
    restartHomebridge, reloadConfig,
  } = useContext(ConfigContext);

  const theme = useTheme();

  const toggleDrawer = (value) => (event) => {
    if (
      event
      && event.type === 'keydown'
      && (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setOpen(value);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleRestart = () => {
    showAlert('info', 'Restarting Homebridge...');
    restartHomebridge().then(() => {
      showAlert('success', 'Homebridge restarted!');
    });
  };

  const handleReload = () => {
    showAlert('info', 'Reloading config...');
    reloadConfig().then(() => {
      showAlert('success', 'Config reloaded!');
    });
  };

  const pages = [
    { label: 'Add Scene', slug: 'addScene' },
    { label: 'Remove Scene', slug: 'removeScene' },
    { label: 'Edit Scene Slots', slug: 'editSceneSlots' },
    { label: 'View Devices', slug: 'devices' },
  ];

  const DrawerHeader = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1, 0, 0),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  }));

  const onToggleChange = () => {
    setOpen(false);
  };

  const drawerTop = {
    top: 56,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      top: 48,
    },
    [theme.breakpoints.up('sm')]: {
      top: 64,
    },
  };

  return (
    <SwipeableDrawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        ...drawerTop,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          ...drawerTop,
        },
      }}
      // onClose={handleDrawerClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
      }}
      anchor="left"
      open={open}
      onClose={toggleDrawer(false)}
      onOpen={toggleDrawer(true)}
    >
      <Box
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <RoomToggle onToggleChange={onToggleChange} />
        <List>
          {pages.map(({ label, slug }) => (
            <Link
              to={`/${slug}`}
              key={slug}
              onClick={(e) => {
                setOpen(false);
                return e;
              }}
            >
              <ListItem disablePadding to={`/${slug}`}>
                <ListItemButton>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            </Link>
          ))}
          <ListItem key="restart">
            <Button
              size="large"
              variant="contained"
              disabled={restarting}
              onClick={handleRestart}
              startIcon={restarting ? null : <RestartAlt />}
              sx={{ width: '100%' }}
            >
              {restarting ? <CircularProgress /> : 'RESTART HOMEBRIDGE'}
            </Button>
          </ListItem>
          <ListItem key="reload">
            <Button
              size="large"
              variant="contained"
              disabled={!loaded}
              onClick={handleReload}
              startIcon={!loaded ? null : <RestartAlt />}
              sx={{ width: '100%' }}
            >
              {!loaded ? <CircularProgress /> : 'Reload Config'}
            </Button>
          </ListItem>
        </List>
        <Divider />
        <List>
          <Link
            to="/lightStates"
            onClick={(e) => {
              setOpen(false);
              return e;
            }}
          >
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Light States" />
              </ListItemButton>
            </ListItem>
          </Link>
        </List>
      </Box>
    </SwipeableDrawer>
  );
};

export default TopMenu;
