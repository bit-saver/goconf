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
import { Alert } from './components/Alert';
import Updater from './pages/Updater';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontSize: 14,
    htmlFontSize: 16,
    h4: {
      fontSize: '2rem ',
    },
  },
});

const router = createBrowserRouter([
  {
    element: <Home />,
    children: [
      {
        path: '/',
        element: <AddScene />,
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
      {
        path: '/updater',
        element: <Updater />,
      },
    ],
  },
]);

const App = () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <main style={{ margin: 0 }}>
      <ApiProvider>
        <ConfigProvider>
          <Alert>
            <RouterProvider router={router} />
          </Alert>
        </ConfigProvider>
      </ApiProvider>
    </main>
  </ThemeProvider>
);

export default App;
