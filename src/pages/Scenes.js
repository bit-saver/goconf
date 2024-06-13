import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Switch,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { useTheme } from '@mui/material/styles';
import PageTitle from '../components/PageTitle';
import { getDevicesByRoom, getRoomName } from '../util/util';
import ConfigContext from '../util/contexts/ConfigContext';
import ApiContext from '../util/contexts/ApiContext';
import AlertContext from '../util/contexts/Alert';
import SceneMedia from '../components/SceneMedia';

const Scenes = () => {
  const { haCallWebhook, apiUpload } = useContext(ApiContext);
  const { room, getGoconf } = useContext(ConfigContext);
  const { showAlert } = useContext(AlertContext);
  const [showDevices, setShowDevices] = useState(false);
  const [sceneSlots, setSceneSlots] = useState([]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadData, setUploadData] = useState({
    sceneSlot: undefined,
    currentFile: '',
    previewImage: '',
  });

  const inputFile = useRef(null);

  const theme = useTheme();

  const goconf = getGoconf();

  const setUploadState = (state) => {
    setUploadData({ ...uploadData, ...state });
  };

  const updateSceneSlots = () => {
    const scenes = goconf.sceneSlots.filter((ss) => ss.room === room);
    console.log('updated scenes', scenes);
    setSceneSlots(scenes);
  };

  useEffect(() => {
    updateSceneSlots();
  }, [room]);

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
    if (uploadProgress) {
      showAlert('error', 'Upload currently in progress');
      return;
    }
    setUploadState({
      currentFile: event.target.files[0],
      previewImage: URL.createObjectURL(event.target.files[0]),
    });
    setUploadProgress(0);
  };

  const handleUpload = () => {
    console.log('[handleUpload] starting upload...');
    setUploadProgress(0);
    const { scene, room: sceneRoom } = uploadData.sceneSlot;
    const filenameParts = uploadData.currentFile.name.split('.');
    const ext = filenameParts[filenameParts.length - 1];
    const filename = `${sceneRoom}/${scene.replaceAll(' ', '_')}.${ext}`;
    apiUpload(uploadData.currentFile, filename, (event) => {
      const progress = Math.round((100 * event.loaded) / event.total);
      console.log('[handleUpload] progress', progress);

      setUploadProgress(progress);
    })
      .then((response) => {
        uploadData.sceneSlot.imagePath = response.data.url;
        console.log('upload response', response);
        return goconf.updateScene(uploadData.sceneSlot).then(() => {
          updateSceneSlots();
          setUploadState({
            currentFile: undefined,
            sceneSlot: null,
          });
          setUploadProgress(0);
          return uploadData.currentFile;
        });
      })
      .catch((err) => {
        showAlert('error', `Image could not be uploaded. ${err.toString()}`);
        setUploadState({
          currentFile: undefined,
          sceneSlot: null,
        });
        setUploadProgress(0);
        console.error(err);
        return null;
      });
  };

  const handleImageClick = (sceneSlot) => {
    if (uploadProgress !== 0 && uploadData.currentFile) {
      showAlert('error', 'Upload currently in progress');
      return;
    }
    setUploadState({ sceneSlot, currentFile: undefined });
    setUploadProgress(0);
    inputFile.current.click();
  };

  useEffect(() => {
    if (uploadData.currentFile && !uploadProgress) {
      console.log('Current file changed, beginning upload', uploadData.currentFile);
      handleUpload();
    }
  }, [uploadData.currentFile]);

  const getSceneDeviceData = (sceneSlot) => {
    const configured = sceneSlot.devices.map((ssd) => ssd.device);
    const missing = getDevicesByRoom(room).filter((device) => !configured.includes(device));
    return {
      configured,
      missing,
    };
  };

  const isUploading = (sceneSlot) => {
    if (!uploadData.sceneSlot || !uploadProgress) {
      return false;
    }
    return uploadData.sceneSlot.scene === sceneSlot.scene && uploadData.sceneSlot.slot === sceneSlot.slot;
  };

  return (
    <Grid item xs={12}>
      <PageTitle
        title="Scenes"
        subtitle={getRoomName(room)}
        control={(
          <FormControlLabel
            control={(
              <Switch
                checked={showDevices}
                onChange={(e) => setShowDevices(e.target.checked)}
              />
            )}
            label="Show Devices"
          />
        )}
      />
      <Grid container spacing={2}>
        {sceneSlots.filter((ss) => ss.scene).map((sceneSlot) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={Math.random()}>
            <Card>
              <CardHeader
                title={sceneSlot.scene}
                titleTypographyProps={{
                  align: 'center',
                }}
              />
              <Box sx={{ display: 'inline-block', position: 'relative', width: '100%' }}>
                <SceneMedia sceneSlot={sceneSlot} />
                {isUploading(sceneSlot) && (
                  <Box sx={{
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgb(0, 0, 0, 0.75)',
                    zIndex: 9998,
                  }} />
                )}
                {(!sceneSlot?.imagePath && !isUploading(sceneSlot)) && (
                  <UploadFileIcon
                    fontSize="large"
                    sx={{
                      position: 'absolute',
                      right: 'calc(50% - 17px)',
                      top: 'calc(50% - 17px)',
                      zIndex: 9999,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleImageClick(sceneSlot)}
                  />
                )}
                {(sceneSlot?.imagePath && !isUploading(sceneSlot)) && (
                  <UploadFileRoundedIcon
                    fontSize="large"
                    sx={{
                      position: 'absolute',
                      right: '5px',
                      bottom: '5px',
                      zIndex: 999,
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.success.main },
                    }}
                    onClick={() => handleImageClick(sceneSlot)}
                  />
                )}
                {isUploading(sceneSlot) && (
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      position: 'absolute',
                      right: 'calc(50% - 17px)',
                      top: 'calc(50% - 17px)',
                      zIndex: 999,
                    }}
                    onClick={() => handleImageClick(sceneSlot)}
                  />
                )}
              </Box>
              <CardContent>
                {showDevices && (
                  <List dense disablePadding sx={{ columns: 2 }}>
                    {getSceneDeviceData(sceneSlot).configured.map((device) => (
                      <ListItem key={Math.random()} sx={{ paddingTop: 0, paddingBottom: 0 }}>
                        <ListItemText
                          sx={{ marginTop: 0, marginBottom: 0 }}
                        >
                          {device}
                        </ListItemText>
                      </ListItem>
                    ))}
                    {getSceneDeviceData(sceneSlot).missing.map((device) => (
                      <ListItem key={Math.random()} sx={{ paddingTop: 0, paddingBottom: 0 }}>
                        <ListItemText
                          sx={{ marginTop: 0, marginBottom: 0 }}
                          primaryTypographyProps={{ color: 'error' }}
                        >
                          {device}
                        </ListItemText>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              <CardActions>
                <Button
                  color="success"
                  variant="outlined"
                  sx={{ width: '100%', height: '50px' }}
                  onClick={() => handleActivate(sceneSlot)}
                  size="large"
                >
                  Activate
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <input
        ref={inputFile}
        name="imageFile"
        style={{ display: 'none' }}
        type="file"
        accept="image/*, video/*"
        onChange={handleSelectFile}
      />
    </Grid>
  );
};

export default Scenes;
