export const asyncTimeout = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const getHbApiUrl = (path) => `http://raspi:5654/http://raspi:8581/${path.replace(/^\/+/, '')}`;

export const getHaApiUrl = (path) => `https://raspity.duckdns.org/api/${path.replace(/^\/+/, '')}`;

export const getApiUrl = (path) => `http://raspi:8080/api/${path.replace(/^\/+/, '')}`;

export const rgbToHex = (rgbColor) => {
  // Choose correct separator
  const sep = ', ';
  // Turn "rgb(r,g,b)" into [r,g,b]
  const rgb = rgbColor.split(sep);

  let r = (+rgb[0]).toString(16);
  let g = (+rgb[1]).toString(16);
  let b = (+rgb[2]).toString(16);

  if (r.length === 1) r = `0${r}`;
  if (g.length === 1) g = `0${g}`;
  if (b.length === 1) b = `0${b}`;

  return `#${r}${g}${b}`;
};

export const hexToRgb = (hex) => {
  let r = 0;
  let g = 0;
  let b = 0;

  // 3 digits
  if (hex.length === 4) {
    r = `0x${hex[1]}${hex[1]}`;
    g = `0x${hex[2]}${hex[2]}`;
    b = `0x${hex[3]}${hex[3]}`;

    // 6 digits
  } else if (hex.length === 7) {
    r = `0x${hex[1]}${hex[2]}`;
    g = `0x${hex[3]}${hex[4]}`;
    b = `0x${hex[5]}${hex[6]}`;
  }

  return [+r, +g, +b];
};

// eslint-disable-next-line max-len
export const checkSubset = (parentArray, subsetArray) => subsetArray.some((el) => parentArray.includes(el));

export const TOKEN_KEY = 'goconf_token';

export const GOVEE_TOKEN_KEY = 'govee_token';

export const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4Mzc1NjA4MTg5ZTI0NTg5OTI4OGM1MDg0NjEwNzNkMyIsImlhdCI6MTY5MjE4OTYwMiwiZXhwIjoyMDA3NTQ5NjAyfQ.DV9uQrZ7oA3eNsSSNqhs1vWLEmj5xG68AOyDgLnpEtE';

export const defaultSlots = [
  'scene', 'sceneTwo', 'sceneThree', 'sceneFour',
  'diyMode', 'diyModeTwo', 'diyModeThree', 'diyModeFour',
  'segmented', 'segmentedTwo', 'segmentedThree', 'segmentedFour',
  'musicMode', 'musicModeTwo', 'videoMode', 'videoModeTwo',
  'extra', 'extraTwo', 'extraThree', 'extraFour', 'extraFive',
  'extraSix', 'extraSeven', 'extraEight', 'extraNine', 'extraTen',
  'extraEleven', 'extraTwelve', 'extraThirteen', 'extraFourteen', 'extraFifteen',
  'extraSixteen', 'extraSeventeen', 'extraEighteen', 'extraNineteen', 'extraTwenty',
  'extraTwentyOne', 'extraTwentyTwo', 'extraTwentyThree', 'extraTwentyFour', 'extraTwentyFive',
  'extraTwentySix', 'extraTwentySeven', 'extraTwentyEight', 'extraTwentyNine', 'extraThirty',
];

export const deviceRooms = {
  'Beam Strip': 'living_room',
  'TV Strip': 'living_room',
  'Kitchen Strip': 'living_room',
  'Window Strip': 'living_room',
  'Couch Strip': 'living_room',
  'Center Strip': 'living_room',
  'String Lights': 'living_room',
  Hex: 'living_room',
  Curtain: 'living_room',
  Lamp: 'living_room',
  'Office Squares': 'office',
  'Office Curtain': 'office',
  'Office Strip': 'office',
  Desk: 'office',
};

export const rooms = [
  {
    key: 'living_room', name: 'Living Room', short: 'Living', prefix: '',
  },
  {
    key: 'office', name: 'Office', short: 'Office', prefix: 'Office',
  },
  {
    key: 'bedroom', name: 'Bedroom', short: 'Bed', prefix: 'Bed',
  },
];

export const bulbs = {
  'light.lamp': {
    label: 'Lamp', entity_id: 'light.lamp', state: null, group: 'Lamp', room: 'living_room',
  },
  'light.kitchen_1': {
    label: 'Kitchen 1', entity_id: 'light.kitchen_1', state: null, group: 'Balcony', room: 'living_room',
  },
  'light.kitchen_2': {
    label: 'Kitchen 2', entity_id: 'light.kitchen_2', state: null, group: 'Balcony', room: 'living_room',
  },
  'light.sink_1': {
    label: 'Sink 1', entity_id: 'light.sink_1', state: null, group: 'Sink', room: 'living_room',
  },
  'light.sink_2': {
    label: 'Sink 2', entity_id: 'light.sink_2', state: null, group: 'Sink', room: 'living_room',
  },
  'light.door_1': {
    label: 'Door 1', entity_id: 'light.door_1', state: null, group: 'Door', room: 'living_room',
  },
  'light.door_2': {
    label: 'Door 2', entity_id: 'light.door_2', state: null, group: 'Door', room: 'living_room',
  },
  'light.hall_1': {
    label: 'Hall 1', entity_id: 'light.hall_1', state: null, group: 'Hall', room: 'living_room',
  },
  'light.hall_2': {
    label: 'Hall 2', entity_id: 'light.hall_2', state: null, group: 'Hall', room: 'living_room',
  },
  'light.desk': {
    label: 'Desk', entity_id: 'light.desk', state: null, group: 'Desk', room: 'office',
  },
  'light.office_1': {
    label: 'Office 1', entity_id: 'light.office_1', state: null, group: 'Office Fan', room: 'office',
  },
  'light.office_2': {
    label: 'Office 2', entity_id: 'light.office_2', state: null, group: 'Office Fan', room: 'office',
  },
  'light.office_3': {
    label: 'Office 3', entity_id: 'light.office_3', state: null, group: 'Office Fan', room: 'office',
  },
};

export const rgbModels = [
  'H6002',
  'H6003',
  'H6006',
  'H6008',
  'H6009',
  'H6010',
  'H601A',
  'H601B',
  'H601C',
  'H6046',
  'H6047',
  'H6049',
  'H604A',
  'H604B',
  'H604C',
  'H604D',
  'H6050',
  'H6051',
  'H6052',
  'H6054',
  'H6056',
  'H6057',
  'H6058',
  'H6059',
  'H605B',
  'H605C',
  'H605D',
  'H6061',
  'H6062',
  'H6065',
  'H6066',
  'H6067',
  'H606A',
  'H6071',
  'H6072',
  'H6073',
  'H6075',
  'H6076',
  'H6078',
  'H6083',
  'H6085',
  'H6086',
  'H6087',
  'H6088',
  'H608A',
  'H608B',
  'H608C',
  'H6089',
  'H6091',
  'H6092',
  'H60A0',
  'H6104',
  'H6109',
  'H610A',
  'H610B',
  'H6110',
  'H6117',
  'H611A',
  'H611B',
  'H611C',
  'H611Z',
  'H6121',
  'H6135',
  'H6137',
  'H6141',
  'H6142',
  'H6143',
  'H6144',
  'H6148',
  'H614A',
  'H614B',
  'H614C',
  'H614D',
  'H614E',
  'H6154',
  'H6159',
  'H615A',
  'H615B',
  'H615C',
  'H615D',
  'H615E',
  'H6160',
  'H6163',
  'H6167',
  'H6168',
  'H6172',
  'H6173',
  'H6176',
  'H6182',
  'H6188',
  'H618A',
  'H618C',
  'H618E',
  'H618F',
  'H6195',
  'H6198',
  'H6199',
  'H619A',
  'H619B',
  'H619C',
  'H619D',
  'H619E',
  'H619Z',
  'H61A0',
  'H61A1',
  'H61A2',
  'H61A3',
  'H61A5',
  'H61A8',
  'H61B2',
  'H61BA',
  'H61BC',
  'H61BE',
  'H61C2',
  'H61C3',
  'H61C5',
  'H61E0',
  'H61E1',
  'H6601',
  'H6602',
  'H6609',
  'H7005',
  'H7006',
  'H7007',
  'H7008',
  'H7012',
  'H7013',
  'H7020',
  'H7021',
  'H7022',
  'H7028',
  'H7031',
  'H7032',
  'H7033',
  'H7041',
  'H7042',
  'H7050',
  'H7051',
  'H7055',
  'H705A',
  'H705B',
  'H705C',
  'H7060',
  'H7061',
  'H7062',
  'H7065',
  'H7066',
  'H706C',
  'H70A1',
  'H70B1',
  'H70B5',
  'H70C1',
  'H70C2',
  'HXXXX', // placeholder for LAN-only configured models
];

export const getRoomName = (room) => {
  if (!room) return '';
  const result = room.split('_').map((w) => `${w.substring(0, 1).toUpperCase()}${w.substring(1)}`);
  return result.join(' ');
};
