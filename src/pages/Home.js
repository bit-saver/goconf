import React, { useContext, useEffect } from 'react';
import ApiContext from '../util/ApiContext';
import Login from './Login';
import Main from './Main';
import ConfigContext from '../util/ConfigContext';

function Home() {
    const { loaded, reloadConfig } = useContext(ConfigContext);
    const { token } = useContext(ApiContext);

    useEffect(() => {
        if (!loaded && token) {
            reloadConfig().then();
        }
    }, [token, loaded]);
    console.log('token is:', token);
    if (!token) {
        return <Login />;
    }
    if (loaded) {
        return <Main sx={{ marginTop: '60px' }} />;
    }
    return 'Loading...';
}

export default Home;
