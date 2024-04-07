import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress, Grid } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ApiContext from '../util/ApiContext';
import Layout from '../components/Layout';
import ConfigContext from '../util/ConfigContext';

function Home() {
  const { loaded, reloadConfig } = useContext(ConfigContext);
  const { token, apiCheckAuth } = useContext(ApiContext);

  const location = useLocation();
  const navigate = useNavigate();

  const onLogin = location.pathname === '/login';

  const [authState, setAuthState] = useState(null);

  /*
    1) Check HB token status
    2) If token is invalid, redirect to login
    3) Download HB Config
    4) Check Govee token status
    5) If Govee token is invalid, renew it with HB config creds
    6) Download scenes and parse data
    7) Upon completion of config, set config loaded and authenticated
     */
  useEffect(() => {
    apiCheckAuth().then((auth) => {
      setAuthState(auth);
      // console.log('auth', auth);
      if (!onLogin && (!auth || !token)) {
        navigate('/login', { replace: true });
      } else if (!loaded) {
        console.log('[Home] reloading config...');
        reloadConfig().then();
      }
    }).catch((err) => {
      console.log('Auth check error', err);
      setAuthState(null);
      navigate('/login', { replace: true });
    });
  }, [token, loaded]);

  const showOutlet = onLogin || (loaded && authState);
  const showLoader = !showOutlet;

  return (
    <Layout>
      {showOutlet && <Outlet />}
      {showLoader && (
        <Grid container item xs={12} spacing={4} justifyContent="center">
          <CircularProgress sx={{ marginTop: '30vh', marginLeft: '32px' }} />
        </Grid>
      )}
    </Layout>
  );
}

export default Home;
