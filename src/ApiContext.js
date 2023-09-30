import React, {
  createContext, useEffect, useMemo, useState,
} from 'react';
import axios from 'axios';

const getApiUrl = (path) => `http://raspi.local:5654/http://raspi.local:8581/${path.replace(/^\/+/, '')}`;

const ApiContext = createContext(null);

const TOKEN_KEY = 'goconf_token';

export function ApiProvider({ children }) {
  const [token, setToken] = useState(sessionStorage.getItem(TOKEN_KEY));
  // console.log('[Provider] token', token);

  useEffect(() => {
    if (token !== sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }, [token]);

  const apiGetScenes = async () => axios.get('http://raspi.local:8080/api/getScenes');

  const apiSaveScenes = async (data) => axios.post('http://raspi.local:8080/api/saveScenes', data, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json; charset=UTF-8',
    },
  });

  const checkAuthError = (result) => {
    if ([401, 403].includes(result?.response?.status)) {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  };

  const apiGet = async (path) => {
    if (!token) {
      return new Error('Missing token.');
    }
    const result = await axios.get(getApiUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => {
      checkAuthError(err);
      return null;
    });
    return result;
  };

  const apiPut = async (path) => {
    if (!token) {
      return new Error('Missing token.');
    }
    const result = await axios.put(getApiUrl(path), {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => {
      checkAuthError(err);
      return err;
    });
    return result;
  };

  const apiPost = async (path, data) => {
    if (!token && path !== '/api/auth/login') {
      return new Error('Missing token.');
    }
    const result = await axios.post(getApiUrl(path), data, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).catch((err) => {
      checkAuthError(err);
      return err;
    });
    return result;
  };

  const providerValue = useMemo(() => ({
    token, setToken, apiGet, apiPost, apiPut, apiGetScenes, apiSaveScenes,
  }), [token, setToken, apiGet, apiPost, apiPut, apiGetScenes, apiSaveScenes]);

  return (
    <ApiContext.Provider value={providerValue}>
      { children }
    </ApiContext.Provider>
  );
}
export default ApiContext;
