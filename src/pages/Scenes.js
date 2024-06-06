import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import {
  Button,
  Card, CardActions, CardContent, CardMedia, Grid,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PageTitle from '../components/PageTitle';
import { getRoomName } from '../util/util';
import ConfigContext from '../util/contexts/ConfigContext';
import ApiContext from '../util/contexts/ApiContext';
import AlertContext from '../util/contexts/Alert';

const Scenes = () => {
  const { haCallWebhook, apiUpload } = useContext(ApiContext);
  const { room, getGoconf } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);

  const inputFile = useRef(null);
  const [uploadData, setUploadData] = useState({
    sceneSlot: undefined,
    currentFile: '',
    previewImage: '',
    progress: 0,
    message: '',
    isError: false,
    imageInfos: [],
  });

  const setUploadState = (state) => {
    setUploadData({ ...uploadData, ...state });
  };

  const goconf = getGoconf();

  const scenes = goconf.sceneSlots.filter((ss) => ss.room === room);

  const handleActivate = (sceneSlot) => {
    if (!sceneSlot) return;
    haCallWebhook('activate_view', { scene: sceneSlot.scene, room }).then(() => {
      showAlert('success', 'Scene activated!');
    }).catch((err) => {
      console.error(err);
      showAlert('error', 'Error activating scene.');
    });
  };

  const handleSelectFile = (event) => {
    console.log('[handleSelectFile]', event.target.files[0]);
    if (uploadData.progress) {
      showAlert('error', 'Upload currently in progress');
      return;
    }
    setUploadState({
      currentFile: event.target.files[0],
      previewImage: URL.createObjectURL(event.target.files[0]),
      progress: 0,
      message: '',
    });
  };

  const handleUpload = () => {
    console.log('[handleUpload] starting upload...');
    setUploadState({ progress: 0 });
    const { scene, room: sceneRoom } = uploadData.sceneSlot;
    const filenameParts = uploadData.currentFile.name.split('.');
    const filename = `${sceneRoom}/${scene}.${filenameParts[filenameParts.length - 1]}`;
    apiUpload(uploadData.currentFile, filename, (event) => {
      const progress = Math.round((100 * event.loaded) / event.total);
      console.log('[handleUpload] progress', progress);
      setUploadState({ progress });
    })
      .then((response) => {
        uploadData.sceneSlot.imagePath = filename;
        goconf.updateScene(uploadData.sceneSlot);
        setUploadState({
          message: response.data.message,
          isError: false,
          progress: 0,
          currentFile: undefined,
          sceneSlot: null,
        });
        return uploadData.currentFile;
      })
      .catch((err) => {
        showAlert('error', `Image could not be uploaded. ${err.toString()}`);
        setUploadState({
          progress: 0,
          message: 'Could not upload the image!',
          currentFile: undefined,
          isError: true,
          sceneSlot: null,
        });
        console.error(err);
      });
  };

  const handleImageClick = (sceneSlot) => {
    if (uploadData.progress !== 0) {
      showAlert('error', 'Upload currently in progress');
      return;
    }
    setUploadState({ sceneSlot });
    inputFile.current.click();
  };

  useEffect(() => {
    if (uploadData.currentFile && !uploadData.progress) {
      console.log('Current file changed, beginning upload', uploadData.currentFile);
      handleUpload();
    }
  }, [uploadData.currentFile]);

  return (
    <Grid item xs={12}>
      <PageTitle
        title="Scenes"
        subtitle={getRoomName(room)}
      />

      <input
        ref={inputFile}
        name="imageFile"
        style={{ display: 'none' }}
        type="file"
        accept="image/*"
        onChange={handleSelectFile}
      />

      <Grid container spacing={2}>
        {scenes.filter((ss) => ss.scene).map((sceneSlot) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={Math.random()}>
            <Card>
              <CardMedia
                sx={{
                  height: '150px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgb(40, 40, 40)',
                  cursor: 'pointer',
                }}
                image={sceneSlot?.imagePath ? `http://raspi:8080/images/${sceneSlot.imagePath}` : null}
                title={sceneSlot.scene}
                onClick={() => handleImageClick(sceneSlot)}
              >
                {!sceneSlot?.image && (
                  <UploadFileIcon
                    fontSize="large"
                  />
                )}
              </CardMedia>
              <CardContent>
                <Typography variant="h5" align="center">
                  {sceneSlot.scene}
                </Typography>

              </CardContent>
              <CardActions>
                <Button
                  color="success"
                  variant="outlined"
                  sx={{ width: '100%' }}
                  onClick={() => handleActivate(sceneSlot)}
                >
                  Activate
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default Scenes;
