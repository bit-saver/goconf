import { CardMedia } from '@mui/material';
import React from 'react';
import { SERVER_IP, getImageUrl } from '../util/util';

const SceneMedia = ({ sceneSlot }) => {
  const path = sceneSlot?.imagePath;
  let component = '';
  if (path && path.endsWith('.mp4')) {
    component = 'video';
  }

  return (
    <CardMedia
      sx={{
        height: 'auto',
        minHeight: '199px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(40, 40, 40)',
        ...(sceneSlot?.imagePath ? {} : { margin: '0 18px' }),
      }}
      image={sceneSlot?.imagePath ? getImageUrl(sceneSlot.imagePath) : 'data:,'}
      component={component}
      title={sceneSlot.scene}
      autoPlay
      muted
      loop
    />
  );
};

export default SceneMedia;
