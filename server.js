const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const configPath = '/usr/app/hb/config.json';

// App
const app = express();

// add middlewares
app.use(express.static(path.join(__dirname, 'goconf', 'build')));
app.use(express.static('public'));

const getConfig = () => {
  const rawData = fs.readFileSync(configPath);
  return JSON.parse(rawData.toString());
};

app.use(cors());

app.use(express.json());

app.post('/api/saveConfig', function (request, response) {
  console.log(request.body);      // your JSON
  const config = getConfig();
  const index = config.platforms.findIndex((p) => p.name === 'Govee');
  config.platforms[index].lightDevices = request.body;
  fs.writeFileSync(configPath, JSON.stringify(config));
  response.send(request.body);    // echo the result back
});

app.get('/api/getConfig', function (request, response) {
  const data = getConfig();
  const goveeConfig = data.platforms.find((p) => p.name === 'Govee');
  if (goveeConfig) {
    return response.json(goveeConfig.lightDevices);
  }
  response.json({'error': 'Could not parse config.'});
});

app.get('/api/getLog', function (request, response) {
  const log = fs.readFileSync('/usr/app/hb/homebridge.log');
  response.send(log.toString());
});

app.get('/api/getScenes', function (request, response) {
  const rawData = fs.readFileSync('/usr/app/nr/scenes.json');
  return response.json(JSON.parse(rawData.toString()));
});

app.post('/api/saveScenes', function (request, response) {
  fs.writeFileSync('/usr/app/nr/scenes.json', JSON.stringify(request.body));
  response.send(response.body);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);