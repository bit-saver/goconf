import React, {
    createContext, useEffect, useMemo, useState,
} from 'react';
import axios from 'axios';
import {
    getApiUrl, getHaApiUrl, getHbApiUrl, GOVEE_TOKEN_KEY, HA_TOKEN, TOKEN_KEY,
} from './util';

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
    const getToken = (tokenKey) => sessionStorage.getItem(tokenKey);

    const [token, setToken] = useState(getToken(TOKEN_KEY));
    const [goveeToken, setGoveeToken] = useState(getToken(GOVEE_TOKEN_KEY));

    const [authenticated, setAuthenticated] = useState(false);

    const saveToken = (tokenKey, userToken) => {
        sessionStorage.setItem(tokenKey, userToken);
        if (tokenKey === TOKEN_KEY) {
            setToken(userToken);
        } else if (tokenKey === GOVEE_TOKEN_KEY) {
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

    const haCallService = async (domain, service, data) => axios.post(getHaApiUrl(`services/${domain}/${service}`), data, {
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
        if (!token) {
            return new Error('Missing token.');
        }
        return axios.get(getHbApiUrl(path), {
            headers: {
                Authorization: `Bearer ${token}`,
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

    const apiCheckAuth = async () => axios.get(getHbApiUrl('/api/auth/check'), {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    }).catch(() => null);

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
        setGoveeToken(ttrToken);
        return ttrToken;
    };

    const gvGetScenes = async (freshToken = null) => axios({
        url: 'https://app2.govee.com/bff-app/v1/exec-plat/home',
        method: 'get',
        headers: {
            Authorization: `Bearer ${freshToken ?? goveeToken}`,
            appVersion: 1,
            clientId: 'goconf',
            clientType: 1,
            iotVersion: 0,
            timestamp: Date.now(),
        },
        timeout: 10000,
    });

    const providerValue = useMemo(() => ({
        token,
        setToken,
        saveToken,
        goveeToken,
        authenticated,
        setAuthenticated,
        apiGet,
        apiPost,
        apiPut,
        apiGetScenes,
        apiSaveScenes,
        apiCheckAuth,
        haGetStates,
        haCallService,
        gvGetToken,
        gvGetScenes,
    }), [
        token, setToken, saveToken, goveeToken,
        gvGetToken, gvGetScenes,
        authenticated, setAuthenticated,
        apiGet, apiPost, apiPut,
        apiGetScenes, apiSaveScenes, apiCheckAuth,
        haGetStates, haCallService,
    ]);

    return (
        <ApiContext.Provider value={providerValue}>
            { children }
        </ApiContext.Provider>
    );
}
export default ApiContext;
