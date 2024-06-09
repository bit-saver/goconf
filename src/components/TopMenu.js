import {
  Box, Button, CircularProgress, useMediaQuery,
} from '@mui/material';
import List from '@mui/material/List';
import { Link, useLocation } from 'react-router-dom';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { RestartAlt } from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import React, { useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import ConfigContext from '../util/contexts/ConfigContext';
import AlertContext from '../util/contexts/Alert';
import RoomToggle from './RoomToggle';

export const drawerWidth = 280;

const TopMenu = ({ open, setOpen }) => {
  const { showAlert } = useContext(AlertContext);
  const {
    restarting, loaded,
    restartHomebridge, reloadConfig,
  } = useContext(ConfigContext);

  const location = useLocation();
  const isLoginPage = location.pathname.startsWith('/login');

  const isPage = (slug) => location.pathname.startsWith(`/${slug}`);

  const theme = useTheme();
  const greaterThanSm = useMediaQuery(theme.breakpoints.up('sm'));

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
    { label: 'Updater', slug: 'updater' },
  ];

  // const DrawerHeader = styled('div')(() => ({
  //   display: 'flex',
  //   alignItems: 'center',
  //   padding: theme.spacing(0, 1, 0, 0),
  //   // necessary for content to be below app bar
  //   ...theme.mixins.toolbar,
  //   justifyContent: 'flex-start',
  // }));

  const onToggleChange = () => {
    setOpen(false);
  };

  const drawerTop = {
    top: 56,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      top: 48,
    },
    [`${theme.breakpoints.up('sm')} and ((orientation: landscape) or (orientation: portrait))`]: {
      top: 64,
    },
  };

  const getLink = (label, slug) => (
    <Link
      to={`/${slug}`}
      key={slug}
      onClick={(e) => {
        setOpen(false);
        return e;
      }}
    >
      <ListItem disablePadding to={`/${slug}`}>
        <ListItemButton selected={isPage(slug)}>
          <ListItemText primary={label} />
        </ListItemButton>
      </ListItem>
    </Link>
  );

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        ...drawerTop,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          ...drawerTop,
        },
      }}
      variant={!greaterThanSm || isLoginPage ? 'temporary' : 'permanent'}
      ModalProps={{
        keepMounted: true,
      }}
      anchor={!greaterThanSm || isLoginPage ? 'right' : 'left'}
      open={isLoginPage ? false : open}
      onClose={toggleDrawer(false)}
      // onOpen={toggleDrawer(true)}
    >
      <Box
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <RoomToggle onToggleChange={onToggleChange} />
        <Divider />
        <List>
          { getLink('Scenes', 'scenes') }
          { getLink('Light States', 'lightStates') }
          { getLink('View Devices', 'devices') }
        </List>
        <Divider />
        <List>
          {pages.map(({ label, slug }) => getLink(label, slug))}
        </List>
        <Divider />
        <List>
          <ListItem key="restart">
            <Button
              size="large"
              variant="contained"
              disabled={restarting}
              onClick={handleRestart}
              startIcon={restarting ? null : <RestartAlt />}
              sx={{ width: '100%' }}
            >
              {restarting && <CircularProgress />}
              {!restarting && (
                <span style={{ whiteSpace: 'nowrap', fontWeight: 500, width: '100%' }}>
                  RESTART HOMEBRIDGE
                </span>
              )}
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
              {!loaded && <CircularProgress />}
              {loaded && (
                <span style={{ whiteSpace: 'nowrap', fontWeight: 500, width: '100%' }}>
                  RELOAD CONFIG
                </span>
              )}
            </Button>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default TopMenu;
