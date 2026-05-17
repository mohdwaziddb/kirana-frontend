// services/textApi.js

import { BASE_URL } from "./baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const processTextAPI = async (input, userId) => {
  try {
    console.log("📤 Sending:", input);

    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem("token");
    
    const params = new URLSearchParams();
    if (userId) params.append("userId", String(userId));

    const res = await fetch(`${BASE_URL}/api/process${params.toString() ? `?${params.toString()}` : ""}`, {
      method: "POST",
      headers: { 
        "Content-Type": "text/plain",
        "Authorization": `Bearer ${token}`
      },
      body: input,
    });

    const data = await res.json();

    console.log("📥 Response:", data);

    return data;

  } catch (err) {
    console.log("❌ Text API error:", err);
    throw err;
  }
};
