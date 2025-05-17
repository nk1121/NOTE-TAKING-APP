



// config.js
import { Platform } from 'react-native';

// ←– replace with the LAN IP you found, e.g. '192.168.1.42'
const LAN_IP = '192.168.1.42';

const BASE_URL =
  Platform.OS === 'android'
    // Android emulator → your host machine
    ? 'http://172.19.139.9:5000'
    // iOS simulator or real device (Expo Go)
    : `http://${LAN_IP}:5000`;

export default BASE_URL;