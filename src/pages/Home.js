import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress, Grid } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ApiContext from '../util/contexts/ApiContext';
import Layout from '../components/Layout';
import ConfigContext from '../util/contexts/ConfigContext';

const Home = () => {
  const { loaded, reloadConfig, pageLoading } = useContext(ConfigContext);
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
    console.log('[Home] token or loaded changed, token:', token, 'loaded: ', loaded);
    console.log('[Home] auth check...');
    apiCheckAuth().then((auth) => {
      console.log('[Home] auth result', auth);
      setAuthState(auth);
      if (!onLogin && (!auth || !token)) {
        console.log('[Home] navigating to login');
        navigate('/login', { replace: true });
      } else if (!loaded) {
        console.log('[Home] reloading config (not loaded)... token:', token);
        reloadConfig().then();
      }
    }).catch((err) => {
      console.log('Auth check error', err);
      setAuthState(null);
      navigate('/login', { replace: true });
    });
  }, [token, loaded]);

  const showOutlet = onLogin || (loaded && authState && !pageLoading);
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
};

export default Home;
