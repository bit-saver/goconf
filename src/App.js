import React, { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiProvider } from './util/ApiContext';
import './App.css';
import { ConfigProvider } from './util/ConfigContext';
// import Main from './pages/Main';
import Home from './pages/Home';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main style={{ margin: '15px' }}>
        <ApiProvider>
          <ConfigProvider>
            <Home />
          </ConfigProvider>
        </ApiProvider>
      </main>
    </ThemeProvider>
  );
}

export default App;
