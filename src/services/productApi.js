import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./baseUrl";

const readErrorMessage = async (response, fallback) => {
  try {
    const text = await response.text();
    if (!text) return fallback;

    try {
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
};

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getSellerProducts = async (userId, { status = "all", query = "" } = {}) => {
  if (!userId) {
    throw new Error("Please login again to view products.");
  }

  const params = new URLSearchParams();
  if (status === "live") params.append("live", "true");
  if (status === "hidden") params.append("live", "false");
  if (query.trim()) params.append("q", query.trim());

  const queryString = params.toString();
  const response = await fetch(
    `${BASE_URL}/api/master/seller/${userId}${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to fetch products."));
  }

  return response.json();
};

export const addSellerProduct = async (product) => {
  const response = await fetch(`${BASE_URL}/api/master/add`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to add product."));
  }

  return response.json();
};

export const updateSellerProduct = async (productId, product) => {
  const response = await fetch(`${BASE_URL}/api/master/${productId}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to update product."));
  }

  return response.json();
};

export const deleteSellerProduct = async (productId, userId) => {
  const params = new URLSearchParams();
  if (userId) params.append("userId", String(userId));
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const headers = await getAuthHeaders();

  const requests = [
    { url: `${BASE_URL}/api/master/${productId}/delete${queryString}`, method: "POST" },
    { url: `${BASE_URL}/api/master/delete/${productId}${queryString}`, method: "POST" },
    { url: `${BASE_URL}/api/master/${productId}${queryString}`, method: "DELETE" },
  ];

  let lastErrorMessage = "Failed to delete product.";

  for (const request of requests) {
    const response = await fetch(request.url, {
      method: request.method,
      headers,
    });

    if (response.ok) {
      return response.json();
    }

    lastErrorMessage = await readErrorMessage(response, lastErrorMessage);

    if (![404, 405].includes(response.status) && !lastErrorMessage.includes("No static resource")) {
      break;
    }
  }

  throw new Error(lastErrorMessage);
};
