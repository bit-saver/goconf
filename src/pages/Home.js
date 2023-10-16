import React, { useContext, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import ApiContext from '../util/ApiContext';
import Layout from './Layout';
import ConfigContext from '../util/ConfigContext';
// import AddScene from './AddScene';
// import RemoveScene from './RemoveScene';
// import EditSceneSlots from './EditSceneSlots';
// import ViewDevices from './ViewDevices';
// import LightStates from './LightStates';

function Home() {
  const { loaded, reloadConfig } = useContext(ConfigContext);
  const { token, apiCheckAuth } = useContext(ApiContext);

  const navigate = useNavigate();

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
      if (!auth) {
        navigate('/login', { replace: true });
      } else if (!loaded) {
        reloadConfig().then();
      }
    });
  }, [token, loaded]);

  return (
    <Layout>
      {loaded && <Outlet />}
      {!loaded && <CircularProgress sx={{ marginTop: '30vh' }} />}
    </Layout>
  );
}

export default Home;
