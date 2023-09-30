import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useContext, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import Config, { asyncTimeout } from '../pages/Config';
import ApiContext from '../ApiContext';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
    marginTop: '50px',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    }),
  }),
);

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));

export default function DrawerMenu() {
  const { apiPut, apiGet } = useContext(ApiContext);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('addScene');
  const [restarting, setRestarting] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const pages = [
    { label: 'Add Scene', slug: 'addScene' },
    { label: 'Remove Scene', slug: 'removeScene' },
    { label: 'Edit Scene Slots', slug: 'editSceneSlots' },
    { label: 'View Devices', slug: 'viewDevices' },
  ];

  const handleRestart = async () => {
    setRestarting(true);
    await apiPut('/api/server/restart');
    // look for data.status === up
    // iterate a setTimeout every 1 or 2 seconds
    // if status is not up, reinitate timer
    let status;
    do {
      // eslint-disable-next-line no-await-in-loop
      await asyncTimeout(1000);
      // eslint-disable-next-line no-await-in-loop
      const result = await apiGet('/api/status/homebridge');
      status = result?.data?.status;
    } while (status !== 'up');
    setRestarting(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
            Govee Config Editor
          </Typography>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            sx={{ ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Main open={open}>
        <Config page={page} />
      </Main>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {pages.map(({ label, slug }) => (
            <ListItem key={slug} disablePadding>
              <ListItemButton onClick={() => setPage(slug)}>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem key="restart">
            <Button
              size="large"
              variant="contained"
              disabled={restarting}
              onClick={handleRestart}
              startIcon={restarting ? null : <RestartAlt />}
            >
              { restarting ? <CircularProgress /> : 'RESTART HOMEBRIDGE'}
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
