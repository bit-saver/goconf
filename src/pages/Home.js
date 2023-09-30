import React, { useContext } from 'react';
import ApiContext from '../ApiContext';
import Login from './Login';
import DrawerMenu from '../components/DrawerMenu';

function Home() {
  const { token } = useContext(ApiContext);
  if (!token) {
    return <Login />;
  }
  return <DrawerMenu />;
}

export default Home;
