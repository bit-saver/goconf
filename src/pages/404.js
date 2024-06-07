import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import PageTitle from '../components/PageTitle';

const ErrorPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  });
  return (
    <Grid item xs={12} justifyContent="center" id="page-container">
      <PageTitle
        title="404"
        subtitle="Not found"
      />
    </Grid>
  );
};

export default ErrorPage;
