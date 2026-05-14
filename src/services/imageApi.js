// services/imageApi.js

import { BASE_URL } from "./baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const uploadImageAPI = async (image, setExtractedText) => {

  if (!image) {
    console.log("❌ No image selected");
    throw new Error("No image selected");
  }

  console.log("📸 IMAGE:", image);

  let blob = null;

  // 🔥 Handle file:// URI (from Expo ImagePicker)
  if (typeof image === "string" && image.startsWith("file://")) {
    console.log("🔄 Converting file URI to Blob...");
    try {
      const response = await fetch(image);
      blob = await response.blob();
    } catch (err) {
      console.log("❌ Error converting file URI:", err);
      throw new Error("Failed to read image file");
    }
  }
  // 🔥 Handle blob URL
  else if (typeof image === "string" && image.startsWith("blob:")) {
    console.log("🔄 Converting blob URL to Blob...");
    const response = await fetch(image);
    blob = await response.blob();
  }
  // Handle File/Blob objects
  else if (image instanceof File || image instanceof Blob) {
    blob = image;
  }
  // Unknown format
  else {
    console.log("❌ Unsupported image format:", typeof image);
    throw new Error("Invalid image format");
  }

  const formData = new FormData();
  formData.append("file", blob, "photo.jpg");

  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem("token");
    
    const res = await fetch(`${BASE_URL}/api/upload-image`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ Server error:", text);
      throw new Error("Upload failed");
    }

    const data = await res.json();

    console.log("📥 Image Response:", data);

    // 🔥 Store extracted text if callback provided
    if (setExtractedText && data.extractedText) {
      setExtractedText(data.extractedText);
    }

    // Return items array
    return data.items || data;

  } catch (err) {
    console.log("❌ Upload API error:", err);
    throw err;
  }
};