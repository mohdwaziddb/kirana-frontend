import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASE_URL } from './baseUrl';

const API_BASE_URL = BASE_URL;

export const saveTableHistory = async (userId, tableData, action) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('=== History API Debug ===');
    console.log('Token found:', token ? 'Yes' : 'No');
    console.log('Token value:', token?.substring(0, 50) + '...');
    console.log('Token length:', token?.length || 0);
    console.log('User ID:', userId);
    console.log('API call data:', { userId, tableData: tableData?.substring(0, 100) + '...', action });
    console.log('BASE_URL being used:', API_BASE_URL);
    
    // Test if token works with a simple API call
    if (token) {
      console.log('Testing token with existing API...');
      try {
        const testResponse = await fetch(`${API_BASE_URL}/api/process`, {
          method: "POST",
          headers: { 
            "Content-Type": "text/plain",
            "Authorization": `Bearer ${token}`
          },
          body: "test",
        });
        console.log('Test API response status:', testResponse.status);
      } catch (testError) {
        console.log('Test API error:', testError.message);
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/api/history/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        tableData: tableData,
        action: action, // 'save' or 'share'
        timestamp: new Date().toISOString()
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      if (response.status === 401) {
        // Clear expired token and trigger logout
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        // Trigger page reload to logout user
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
        
        throw new Error('Your session has expired. Please login again to save history.');
      }
      
      throw new Error(`Failed to save table history: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Save history error:', error);
    throw error;
  }
};

export const getUserHistory = async (userId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/history/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user history');
    }

    const data = await response.json();
    // Backend returns { history: [...], count: X }
    // We need to return just the history array
    return data.history || [];
  } catch (error) {
    console.error('Fetch history error:', error);
    throw error;
  }
};

export const getHistoryById = async (historyId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/history/${historyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch history record');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch history detail error:', error);
    throw error;
  }
};
