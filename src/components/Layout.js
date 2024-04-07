import React, { useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Grid } from '@mui/material';
import TopBar from './TopBar';
import TopMenu from './TopMenu';

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', padding: '16px' }}>
      <CssBaseline />
      <TopBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <Grid container spacing={4} justifyContent="center" sx={{ marginTop: '4px' }}>
        { children }
      </Grid>
      <TopMenu />
    </Box>
  );
};

export default Layout;
