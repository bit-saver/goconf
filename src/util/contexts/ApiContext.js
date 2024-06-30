import React, {
  createContext, useEffect, useMemo, useRef, useState,
} from 'react';
import axios from 'axios';
import {
  getApiUrl, getHaApiUrl, getHbApiUrl, GOVEE_TOKEN_KEY, HA_TOKEN, TOKEN_KEY,
} from '../util';

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const getToken = (tokenKey) => sessionStorage.getItem(tokenKey);

  const [token, setToken] = useState(getToken(TOKEN_KEY));
  const [goveeToken, setGoveeToken] = useState(getToken(GOVEE_TOKEN_KEY));

  const [authenticated, setAuthenticated] = useState(false);

  const tokenRef = useRef(token);
  const goveeTokenRef = useRef(goveeToken);

  const saveToken = (tokenKey, userToken) => {
    sessionStorage.setItem(tokenKey, userToken);
    if (tokenKey === TOKEN_KEY) {
      tokenRef.current = userToken;
      setToken(userToken);
    } else if (tokenKey === GOVEE_TOKEN_KEY) {
      goveeTokenRef.current = userToken;
      setGoveeToken(userToken);
    }
  };

  useEffect(() => {
    if (token !== getToken(TOKEN_KEY)) {
      saveToken(TOKEN_KEY, token);
    }
  }, [token]);

  const apiGetScenes = async () => axios.get(getApiUrl('getScenes'));

  const apiSaveScenes = async (data) => axios.post(getApiUrl('saveScenes'), data, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json; charset=UTF-8',
    },
  });

  const haGetStates = async () => axios.get(getHaApiUrl('states'), {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${HA_TOKEN}`,
    },
  });

  const haCallService = async (domain, service, data) => axios.post(
    getHaApiUrl(`services/${domain}/${service}`),
    data,
    {
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json; charset=UTF-8',
        Authorization: `Bearer ${HA_TOKEN}`,
      },
    },
  );

  const haCallWebhook = async (hook, data) => axios.post(getHaApiUrl(`webhook/${hook}`), data, {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${HA_TOKEN}`,
    },
  });

  const checkAuthError = (error) => {
    if ([401, 403].includes(error?.response?.status)) {
      console.warn('AUTH ERROR');
      saveToken(TOKEN_KEY, null);
      setAuthenticated(false);
      return null;
    }
    return error;
  };

  const apiGet = async (path) => {
    if (!tokenRef.current) {
      return new Error('Missing token.');
    }
    return axios.get(getHbApiUrl(path), {
      headers: {
        Authorization: `Bearer ${tokenRef.current}`,
      },
    }).catch((err) => checkAuthError(err));
  };

  const apiPut = async (path) => {
    if (!token) {
      return new Error('Missing token.');
    }
    return axios.put(getHbApiUrl(path), {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => checkAuthError(err));
  };

  const apiPost = async (path, data) => {
    if (!token && path !== '/api/auth/login') {
      return new Error('Missing token.');
    }
    return axios.post(getHbApiUrl(path), data, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).catch((err) => checkAuthError(err));
  };

  const apiHb = async () => axios.get(getApiUrl('/hb'), {
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json; charset=UTF-8',
    },
  }).catch((err) => checkAuthError(err));

  const apiCheckAuth = async () => axios.get(getHbApiUrl('/api/auth/check'), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  }).catch(() => null);

  const apiUpload = (file, filename, onUploadProgress) => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('filename', filename);

    return axios.post(getApiUrl('upload'), formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  };

  const gvGetToken = async (email, password) => {
    const ttrRes = await axios({
      url: 'https://community-api.govee.com/os/v1/login',
      method: 'post',
      data: {
        email,
        password,
      },
      timeout: 30000,
    });
    if (!ttrRes?.data?.data?.token) {
      throw new Error('Error retrieving Govee token');
    }
    const { token: ttrToken } = ttrRes.data.data;
    saveToken(GOVEE_TOKEN_KEY, ttrToken);
    return ttrToken;
  };

  const gvGetComponents = async (freshToken = null) => axios({
    url: 'https://app2.govee.com/bff-app/v1/exec-plat/home',
    method: 'get',
    headers: {
      Authorization: `Bearer ${freshToken ?? goveeTokenRef.current}`,
      appVersion: 1,
      clientId: 'goconf',
      clientType: 1,
      iotVersion: 0,
      timestamp: Date.now(),
    },
    timeout: 10000,
  });

  const gvGetDevices = async (email, password) => {
    let res = await axios({
      url: 'https://app2.govee.com/account/rest/account/v1/login',
      method: 'post',
      data: {
        email,
        password,
        client: 'goconf',
      },
      timeout: 30000,
    });
    const tempToken = res.data.client.token;

    res = await axios({
      url: 'https://app2.govee.com/device/rest/devices/v1/list',
      method: 'post',
      headers: {
        Authorization: `Bearer ${tempToken}`,
        appVersion: 1,
        clientId: 'goconf',
        clientType: 1,
        iotVersion: 0,
        timestamp: Date.now(),
      },
      timeout: 30000,
    });
    return res.data.devices.map((d) => {
      const json = JSON.parse(d.deviceExt.deviceSettings);
      return [d.deviceName, json.wifiMac];
    });
  };

  const gvGetScenes = async (username = null, password = null) => {
    let res = await gvGetComponents();
    // Check to see we got a response
    if (!res?.data?.data?.components) {
      if (username && password) {
        // Try to get a fresh token
        const ttrToken = await gvGetToken(username, password).catch(() => null);
        if (!ttrToken) {
          return new Error('Error retrieving Govee token.');
        }
        res = await gvGetComponents(ttrToken);
        if (!res) {
          return new Error('Error retrieving Govee scenes.');
        }
      }
    }
    if (res?.data?.data?.components) {
      return res.data.data.components;
    }
    return null;
  };

  const providerValue = useMemo(() => ({
    token,
    setToken,
    tokenRef,
    saveToken,
    goveeToken,
    goveeTokenRef,
    authenticated,
    setAuthenticated,
    apiHb,
    apiGet,
    apiPost,
    apiPut,
    apiGetScenes,
    apiSaveScenes,
    apiCheckAuth,
    apiUpload,
    haGetStates,
    haCallService,
    haCallWebhook,
    gvGetToken,
    gvGetComponents,
    gvGetDevices,
    gvGetScenes,
  }), [
    token, setToken, tokenRef, saveToken, goveeToken, goveeTokenRef,
    gvGetToken, gvGetComponents, gvGetDevices, gvGetScenes,
    authenticated, setAuthenticated,
    apiHb,
    apiGet, apiPost, apiPut, apiUpload,
    apiGetScenes, apiSaveScenes, apiCheckAuth,
    haGetStates, haCallService, haCallWebhook,
  ]);

  return (
    <ApiContext.Provider value={providerValue}>
      { children }
    </ApiContext.Provider>
  );
};
export default ApiContext;
