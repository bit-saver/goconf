import React, { useContext, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
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
import AddScene from './AddScene';
import RemoveScene from './RemoveScene';
import EditSceneSlots from './EditSceneSlots';
import ViewDevices from './ViewDevices';

const drawerWidth = 240;

export default function Main() {
  const {
    loaded, goveeConfig, restarting, restartHomebridge,
  } = useContext(ConfigContext);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('addScene');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handlePage = (toPage) => {
    setOpen(false);
    setPage(toPage);
  };

  const pages = [
    { label: 'Add Scene', slug: 'addScene' },
    { label: 'Remove Scene', slug: 'removeScene' },
    { label: 'Edit Scene Slots', slug: 'editSceneSlots' },
    { label: 'View Devices', slug: 'viewDevices' },
  ];

  const DrawerHeader = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  }));

  return (
    <Box sx={{ display: 'flex', marginTop: '60px' }}>
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
      {loaded && (
        <Grid container spacing={4} justifyContent="center">
          {page === 'addScene'
            && <AddScene goveeConfig={goveeConfig} />}
          {page === 'removeScene'
            && <RemoveScene goveeConfig={goveeConfig} />}
          {page === 'editSceneSlots'
            && <EditSceneSlots />}
          {page === 'viewDevices'
            && <ViewDevices goveeConfig={goveeConfig} />}
        </Grid>
      )}
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
              <ListItemButton onClick={() => handlePage(slug)}>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem key="restart">
            <Button
              size="large"
              variant="contained"
              disabled={restarting}
              onClick={restartHomebridge}
              startIcon={restarting ? null : <RestartAlt />}
              sx={{ width: '100%' }}
            >
              {restarting ? <CircularProgress /> : 'RESTART HOMEBRIDGE'}
            </Button>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onclick={() => handlePage('lightStates')}>
              <ListItemText primary="Light States" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
