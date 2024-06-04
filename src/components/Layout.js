import React, { useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TopBar from './TopBar';
import TopMenu from './TopMenu';

const Layout = ({ children }) => {
  const [open, setOpen] = useState(true);

  const theme = useTheme();

  const drawerTop = {
    marginTop: '56px',
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      marginTop: '48px',
    },
    [theme.breakpoints.up('sm')]: {
      marginTop: '64px',
    },
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <TopBar open={open} setOpen={setOpen} />
      <TopMenu open={open} setOpen={setOpen} />
      <Box sx={{
        display: 'flex',
        padding: '16px',
        width: '100%',
        // [theme.breakpoints.up('xs')]: {
        //   marginLeft: `${drawerWidth}px`,
        // },
        ...drawerTop,
      }}>
        <Grid id="main-content-container" container spacing={0} justifyContent="center">
          { children }
        </Grid>
      </Box>
    </Box>
  );
};

export default Layout;
