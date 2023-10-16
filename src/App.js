import React, { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ApiProvider } from './util/ApiContext';
import './App.css';
import { ConfigProvider } from './util/ConfigContext';
import Login from './pages/Login';
// import Layout from './pages/Layout';
import Home from './pages/Home';
import LightStates from './pages/LightStates';
import ViewDevices from './pages/ViewDevices';
import AddScene from './pages/AddScene';
import RemoveScene from './pages/RemoveScene';
import EditSceneSlots from './pages/EditSceneSlots';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const router = createBrowserRouter([
  {
    element: <Home />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/addScene',
        element: <AddScene />,
      },
      {
        path: '/removeScene',
        element: <RemoveScene />,
      },
      {
        path: '/editSceneSlots',
        element: <EditSceneSlots />,
      },
      {
        path: '/devices',
        element: <ViewDevices />,
      },
      {
        path: '/lightStates',
        element: <LightStates />,
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main style={{ margin: '15px' }}>
        <ApiProvider>
          <ConfigProvider>
            <RouterProvider router={router} />
          </ConfigProvider>
        </ApiProvider>
      </main>
    </ThemeProvider>
  );
}

export default App;
