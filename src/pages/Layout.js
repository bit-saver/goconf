import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import {
  AppBar, Button, CircularProgress, Grid,
} from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import ConfigContext from '../util/ConfigContext';
import AlertContext from '../components/Alert';

const drawerWidth = 240;

export default function Layout({ children }) {
  const { showAlert } = useContext(AlertContext);
  const {
    restarting, restartHomebridge,
  } = useContext(ConfigContext);

  const theme = useTheme();

  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, marginLeft: '10px' }} component="div">
            Govee Config Editor
          </Typography>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            // edge="start"
            edge="end"
            onClick={handleDrawerOpen}
            sx={{ ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Grid container spacing={4} justifyContent="center" sx={{ marginTop: '24px' }}>
        { children }
      </Grid>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
        onClose={handleDrawerClose}
        variant="temporary"
        ModalProps={{
          keepMounted: true,
        }}
        // anchor="left"
        anchor="right"
        open={open}
      >
        {/* <DrawerHeader sx={{ alignSelf: 'end' }}> */}
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {/* <ChevronLeftIcon /> */}
            <ChevronRightIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
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
          <ListItem key="alert">
            <Button
              size="large"
              variant="contained"
              onClick={() => showAlert('success', 'my message')}
              sx={{ width: '100%' }}
            >
              Alert
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
      </Drawer>
    </Box>
  );
}
