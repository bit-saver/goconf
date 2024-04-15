import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

const PageTitle = ({ title, subtitle, control }) => (
  <Grid container justifyContent="space-between" alignItems="center" sx={{ marginBottom: '24px' }}>
    <Grid item xs="auto">
      <Typography variant="h4">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle">
          {subtitle}
        </Typography>
      )}
    </Grid>
    {control && (
      <Grid item xs="auto" justifySelf="end">
        {control}
      </Grid>
    )}
  </Grid>
);

export default PageTitle;
