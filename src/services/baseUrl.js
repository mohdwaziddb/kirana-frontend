// services/baseUrl.js

import Constants from "expo-constants";
import { Platform } from "react-native";

const BACKEND_PORT = 9001;

// Only change this:
// true  = local Spring Boot backend
// false = live AWS backend
const USE_LOCAL_BACKEND = false;

// ==========================================
// LOCAL DEVELOPMENT URLS
// ==========================================

// Android Emulator
const LOCAL_ANDROID_URL = `http://10.0.2.2:${BACKEND_PORT}`;

// Web browser / local desktop
const LOCAL_WEB_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// iOS Simulator
const LOCAL_IOS_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// Real phone fallback. Auto-detect is tried first in Expo Go.
const LOCAL_DEVICE_FALLBACK_URL = `http://192.168.1.12:${BACKEND_PORT}`;

// ==========================================
// LIVE AWS SERVER URL
// ==========================================

const LIVE_URL = "http://13.235.61.146:8081";

// ==========================================
// EXPORT BASE URL
// ==========================================

const getExpoHostUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

  const host = String(hostUri).split(":")[0];

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  return `http://${host}:${BACKEND_PORT}`;
};

const getLocalUrl = () => {
  if (Platform.OS === "web") return LOCAL_WEB_URL;
  const expoHostUrl = getExpoHostUrl();
  if (expoHostUrl) return expoHostUrl;
  if (Platform.OS === "android") return LOCAL_ANDROID_URL;
  if (Platform.OS === "ios") return LOCAL_IOS_URL;
  return LOCAL_DEVICE_FALLBACK_URL;
};

export const BASE_URL = USE_LOCAL_BACKEND ? getLocalUrl() : LIVE_URL;

// ==========================================
// EXAMPLES
// ==========================================

// LOGIN API
// `${BASE_URL}/api/auth/login`

// PRODUCT API
// `${BASE_URL}/api/products`

// IMAGE API
// `${BASE_URL}/uploads/image.png`
