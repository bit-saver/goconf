import React, { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import { ApiProvider } from './ApiContext';
import './App.css';

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
          <Home />
        </ApiProvider>
      </main>
    </ThemeProvider>
  );
}

export default App;
