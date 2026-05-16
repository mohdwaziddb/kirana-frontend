import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASE_URL } from './baseUrl';

const API_BASE_URL = BASE_URL;

const clearSessionIfExpired = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    window.location.reload();
  }
};

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

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Please login again to view history.');
  }
  return token;
};

const normalizeHistoryRecord = (record) => ({
  ...record,
  action: String(record.action || '').toLowerCase(),
  customerName: record.customerName || '',
});

export const saveTableHistory = async (userId, tableData, action, customerName = '') => {
  try {
    if (!userId) {
      throw new Error('Please login again to save history.');
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/history/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        tableData: tableData,
        action: action, // 'save' or 'share'
        customerName: customerName,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearSessionIfExpired();
        throw new Error('Your session has expired. Please login again to save history.');
      }

      const errorText = await readErrorMessage(response, 'Failed to save history.');
      throw new Error(errorText);
    }

    return await response.json();
  } catch (error) {
    console.error('Save history error:', error);
    throw error;
  }
};

export const getUserHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error('Please login again to view history.');
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/history/user/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearSessionIfExpired();
        throw new Error('Your session has expired. Please login again.');
      }

      const errorText = await readErrorMessage(response, 'Failed to fetch history.');
      throw new Error(errorText);
    }

    const data = await response.json();
    const history = Array.isArray(data) ? data : data.history || [];
    return history.map(normalizeHistoryRecord);
  } catch (error) {
    console.error('Fetch history error:', error);
    throw error;
  }
};

export const getHistoryById = async (historyId) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/history/${historyId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearSessionIfExpired();
        throw new Error('Your session has expired. Please login again.');
      }

      const errorText = await readErrorMessage(response, 'Failed to fetch history details.');
      throw new Error(errorText);
    }

    return normalizeHistoryRecord(await response.json());
  } catch (error) {
    console.error('Fetch history detail error:', error);
    throw error;
  }
};

export const deleteHistoryById = async (historyId) => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/history/${historyId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearSessionIfExpired();
        throw new Error('Your session has expired. Please login again.');
      }

      const errorText = await readErrorMessage(response, 'Failed to delete history.');
      throw new Error(errorText);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete history error:', error);
    throw error;
  }
};

export const updateHistoryById = async (historyId, tableData, customerName = '') => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/history/${historyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tableData, customerName })
    });

    if (!response.ok) {
      if (response.status === 401) {
        await clearSessionIfExpired();
        throw new Error('Your session has expired. Please login again.');
      }

      const errorText = await readErrorMessage(response, 'Failed to update history.');
      throw new Error(errorText);
    }

    return normalizeHistoryRecord(await response.json());
  } catch (error) {
    console.error('Update history error:', error);
    throw error;
  }
};
