// services/baseUrl.js

import { Platform } from "react-native";

// ==========================================
// LOCAL DEVELOPMENT URLS
// ==========================================

// Android Emulator
const LOCAL_ANDROID_URL = "http://10.0.2.2:9001";

// iOS Simulator
const LOCAL_IOS_URL = "http://127.0.0.1:9001";

// Real Android Device (Same WiFi)
// Replace with your laptop IPv4 address
const LOCAL_DEVICE_URL = "http://192.168.1.11:9001";

// ==========================================
// LIVE AWS SERVER URL
// ==========================================

const LIVE_URL = "http://13.235.61.146:8081";

// ==========================================
// CHANGE THIS FLAG
// true  = Live AWS Server
// false = Local Backend
// ==========================================

const IS_LIVE = false;

// ==========================================
// EXPORT BASE URL
// ==========================================

export const BASE_URL = IS_LIVE
  ? LIVE_URL
  : Platform.OS === "android"
  ? LOCAL_ANDROID_URL
  : LOCAL_IOS_URL;

// ==========================================
// FOR REAL DEVICE TESTING
// ==========================================

// If testing on physical Android device,
// replace above export with this:

/*
export const BASE_URL = IS_LIVE
  ? LIVE_URL
  : LOCAL_DEVICE_URL;
*/

// ==========================================
// EXAMPLES
// ==========================================

// LOGIN API
// `${BASE_URL}/api/auth/login`

// PRODUCT API
// `${BASE_URL}/api/products`

// IMAGE API
// `${BASE_URL}/uploads/image.png`