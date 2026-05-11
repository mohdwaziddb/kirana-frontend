// services/baseUrl.js

import { Platform } from "react-native";

export const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:9001"
    : "http://127.0.0.1:9001";

// 👉 real device ke liye:
// export const BASE_URL = "http://192.168.1.11:9001"; // Uncomment for real device testing

// 🔥 For production/live deployment, use your actual IP address:
// export const BASE_URL = "http://YOUR_LOCAL_IP:9001"; // Replace YOUR_LOCAL_IP with your computer's IP