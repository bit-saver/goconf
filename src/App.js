import React, { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import { ApiProvider } from './util/contexts/ApiContext';
import './App.css';
import { ConfigProvider } from './util/contexts/ConfigContext';
import { Alert } from './util/contexts/Alert';
import routes from './util/routes';

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

const App = () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <main style={{ margin: 0 }}>
      <ApiProvider>
        <ConfigProvider>
          <Alert>
            <RouterProvider router={routes} />
          </Alert>
        </ConfigProvider>
      </ApiProvider>
    </main>
  </ThemeProvider>
);

export default App;
