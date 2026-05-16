import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { BASE_URL } from "./baseUrl";

export const uploadImageAPI = async (image, setExtractedText) => {
  if (!image) {
    throw new Error("No image selected");
  }

  let fileBody = null;

  if (typeof image === "string" && image.startsWith("file://")) {
    fileBody = Platform.OS === "web"
      ? await (await fetch(image)).blob()
      : { uri: image, name: "photo.jpg", type: "image/jpeg" };
  } else if (typeof image === "string" && image.startsWith("blob:")) {
    fileBody = await (await fetch(image)).blob();
  } else if (
    (typeof File !== "undefined" && image instanceof File) ||
    (typeof Blob !== "undefined" && image instanceof Blob)
  ) {
    fileBody = image;
  } else {
    throw new Error("Invalid image format");
  }

  const formData = new FormData();
  if (Platform.OS === "web") {
    formData.append("file", fileBody, "photo.jpg");
  } else {
    formData.append("file", fileBody);
  }

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
    throw new Error(text || "Upload failed");
  }

  const data = await res.json();

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  const extractedText = typeof data?.extractedText === "string" ? data.extractedText : "";

  if (setExtractedText && extractedText) {
    setExtractedText(extractedText);
  }

  return { items, extractedText, raw: data };
};
