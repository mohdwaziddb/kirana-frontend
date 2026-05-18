import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { BASE_URL } from "./baseUrl";

export const uploadImageAPI = async (image, setExtractedText, userId) => {
  if (!image) {
    throw new Error("No image selected");
  }

  let fileBody = null;
  const imageUri = typeof image === "string" ? image : image?.uri;
  const fileName = image?.fileName || image?.name || "photo.jpg";
  const mimeType = image?.mimeType || image?.type || "image/jpeg";

  if (image?.file && (typeof File !== "undefined" && image.file instanceof File)) {
    fileBody = image.file;
  } else if (typeof imageUri === "string" && (imageUri.startsWith("file://") || imageUri.startsWith("content://"))) {
    fileBody = Platform.OS === "web"
      ? await (await fetch(imageUri)).blob()
      : { uri: imageUri, name: fileName, type: mimeType };
  } else if (typeof imageUri === "string" && imageUri.startsWith("blob:")) {
    fileBody = await (await fetch(imageUri)).blob();
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
    formData.append("file", fileBody, fileName);
  } else {
    formData.append("file", fileBody);
  }

  const token = await AsyncStorage.getItem("token");

  const params = new URLSearchParams();
  if (userId) params.append("userId", String(userId));

  const res = await fetch(`${BASE_URL}/api/upload-image${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;

    try {
      const data = JSON.parse(text);
      message = data.message || data.error || text;
    } catch {
      message = text;
    }

    throw new Error(message || "Scan upload failed. Please try again.");
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
