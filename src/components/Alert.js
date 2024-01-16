import React, { createContext, useMemo, useState } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

const AlertContext = createContext({});

export function Alert({ children }) {
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    type: 'success',
    horizontal: 'center',
    vertical: 'top',
  });

  const handleAlert = (isOpen) => {
    setAlert({
      ...alert,
      open: isOpen,
    });
  };

  const showAlert = (type, message) => {
    setAlert({
      ...alert,
      open: true,
      type,
      message,
    });
  };

  const handleClose = () => {
    setAlert({ ...alert, open: false });
  };

  const providerValue = useMemo(
    () => ({
      alert,
      showAlert,
      handleAlert,
    }),
    [alert, showAlert, handleAlert],
  );

  return (
    <AlertContext.Provider value={providerValue}>
      { children }
      <Snackbar
        anchorOrigin={{ vertical: alert.vertical, horizontal: alert.horizontal }}
        open={alert.open}
        onClose={handleClose}
        autoHideDuration={1500}
        key="snackbar-alert"
      >
        <MuiAlert onClose={handleClose} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </MuiAlert>
      </Snackbar>
    </AlertContext.Provider>
  );
}

export default AlertContext;
