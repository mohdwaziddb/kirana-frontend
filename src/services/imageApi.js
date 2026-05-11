// services/imageApi.js

import { BASE_URL } from "./baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const uploadImageAPI = async (image, setExtractedText) => {

  if (!image) {
    console.log("❌ No image selected");
    throw new Error("No image selected");
  }

  console.log("📸 IMAGE:", image);

  let fileToUpload = image;

  // 🔥 Agar blob URL aa raha hai to convert karo
  if (typeof image === "string" && image.startsWith("blob:")) {
    console.log("🔄 Converting blob URL to File...");

    const response = await fetch(image);
    const blob = await response.blob();

    fileToUpload = new File([blob], "photo.jpg", {
      type: blob.type || "image/jpeg",
    });
  }

  const formData = new FormData();
  formData.append("file", fileToUpload); // ✅ final correct

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