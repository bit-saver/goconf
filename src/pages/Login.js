import {
  Alert, Button, Grid, Paper, Stack, TextField,
} from '@mui/material';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiContext from '../util/ApiContext';

function Login() {
  const { setToken, apiPost, setAuthenticated } = useContext(ApiContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    const result = await apiPost('/api/auth/login', {
      username,
      password,
      otp: 'string',
    })
      .then((resp) => (resp?.data ? resp.data : null))
      .catch(() => null);
    if (!result?.access_token) {
      setAuthenticated(false);
      setError(true);
      return;
    }
    setToken(result.access_token);
    setAuthenticated(true);
    navigate('/', { replace: true });
  };

  return (
    <Grid item xs={12} sm={10} md={8} lg={4}>
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
    </Grid>
  );
}

export default Login;
