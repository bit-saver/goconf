import {
  Alert, Button, Paper, Stack, TextField,
} from '@mui/material';
import React, { useContext, useState } from 'react';
import ApiContext from '../util/ApiContext';

function Login() {
  const { setToken, apiPost } = useContext(ApiContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    const { data: result } = await apiPost('/api/auth/login', {
      username,
      password,
      otp: 'string',
    });
    console.log(result);
    if (!result?.access_token) {
      setError(true);
      return;
    }
    setToken(result.access_token);
  };
  return (
    <Paper sx={{ padding: '15px' }} className="form">
      <form onSubmit={handleLogin}>
        <Stack spacing={2}>
          {error && <Alert severity="error">Error, login failed!</Alert> }
          <TextField
            required
            id="username"
            label="Username"
            value={username}
            onChange={(e) => {
              setError(false);
              setUsername(e.target.value);
            }}
          />
          <TextField
            required
            id="password"
            type="password"
            label="password"
            value={password}
            onChange={(e) => {
              setError(false);
              setPassword(e.target.value);
            }}
          />
          <Button variant="contained" type="submit">Login</Button>
        </Stack>
      </form>
    </Paper>
  );
}

export default Login;
