import React, { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ApiProvider } from './util/ApiContext';
import './App.css';
import { ConfigProvider } from './util/ConfigContext';
import Login from './pages/Login';
// import Layout from './pages/Layout';
import Home from './pages/Home';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/login',
        element: <Login />,
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
