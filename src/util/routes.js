import { createBrowserRouter } from 'react-router-dom';
import React from '@mui/material/styles';
import Home from '../pages/Home';
import AddScene from '../pages/AddScene';
import Login from '../pages/Login';
import RemoveScene from '../pages/RemoveScene';
import EditSceneSlots from '../pages/EditSceneSlots';
import ViewDevices from '../pages/ViewDevices';
import LightStates from '../pages/LightStates';
import Updater from '../pages/Updater';
import Scenes from '../pages/Scenes';
import ErrorPage from '../pages/404';

const routes = createBrowserRouter([
  {
    element: <Home />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Scenes />,
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
      {
        path: '/scenes',
        element: <Scenes />,
      },
    ],
  },
]);

export default routes;
