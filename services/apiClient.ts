// services/apiClient.ts
import { API_CONFIG } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './api';
import { router } from 'expo-router';
import eventEmitter from '@/utils/eventEmitter'; // ✅ ADD THIS

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const notifySubscribers = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

/**
 * Get the current token from storage
 */
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch {
    return null;
  }
};

/**
 * Get the refresh token from storage
 */
const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch {
    return null;
  }
};

/**
 * expressAuthentication (backend/src/auth/authentication.ts) resolves the
 * device identity as request.cookies?.deviceId || headers['x-device-id'] ||
 * a fresh `device_${Date.now()}_${Math.random()}` per call. Mobile has no
 * cookie jar and, before this, never sent the header — so every regular
 * request looked like a different, brand-new device to the backend, and its
 * per-request session upsert kept creating throwaway session rows instead of
 * updating the one actually created at login. deviceId is already embedded
 * in the access token's own JWT payload (decoded straight from the token
 * being sent, so it's always in sync with it, not a possibly-stale
 * AsyncStorage read), so it costs nothing extra to send.
 */
const decodeDeviceId = (jwtToken?: string | null): string | undefined => {
  if (!jwtToken) return undefined;
  try {
    return JSON.parse(atob(jwtToken.split('.')[1]))?.deviceId;
  } catch {
    return undefined;
  }
};

/**
 * Clear all user data and redirect to login
 */
const clearUserDataAndRedirect = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userData');
    console.log('[API] User data cleared due to session expiry');
    
    // ✅ Emit session expired event
    eventEmitter.emit('SESSION_EXPIRED');
  } catch (error) {
    console.error('[API] Error clearing user data:', error);
  }
};

/**
 * Perform token refresh
 */
const performRefresh = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      console.log('[API] No refresh token available');
      return null;
    }

    console.log('[API] Refreshing access token...');

    const result = await refreshAccessToken(refreshToken);
    
    // Check if refresh failed
    if (result?.success === false) {
      console.log('[API] Refresh failed:', result.message);
      
      // If "Invalid session", clear tokens and emit event
      if (result.message?.includes('Invalid') || result.message?.includes('invalid')) {
        await clearUserDataAndRedirect(); // ✅ This emits the event
        return null;
      }
      return null;
    }
    
    // Try different paths for the new token
    const newToken = result?.data?.token || 
                     result?.data?.accessToken || 
                     result?.token || 
                     result?.accessToken;
    
    if (newToken) {
      await AsyncStorage.setItem('userToken', newToken);
      console.log('[API] Token refreshed successfully');
      return newToken;
    }
    
    console.log('[API] No token in refresh response');
    return null;
  } catch (error: any) {
    console.error('[API] Refresh failed:', error.message);
    
    // If error is about invalid session, clear data and emit event
    if (error.message?.includes('Invalid') || error.message?.includes('invalid')) {
      await clearUserDataAndRedirect(); // ✅ This emits the event
    }
    return null;
  }
};

/**
 * Make an authenticated API request with automatic token refresh
 */
export const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  retryCount = 0
): Promise<Response> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // If no token provided, try to get it from storage
  let authToken = token;
  if (!authToken) {
    authToken = await getToken();
  }
  const deviceId = decodeDeviceId(authToken);

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(deviceId ? { 'x-device-id': deviceId } : {}),
    },
  });

  // If token expired (401) and we haven't retried too many times
  if (response.status === 401 && retryCount < 2) {
    console.log('[API] Token expired, attempting refresh...');
    
    // If a refresh is already in progress, wait for it
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push(async (newToken: string) => {
          const retryDeviceId = decodeDeviceId(newToken);
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              ...(retryDeviceId ? { 'x-device-id': retryDeviceId } : {}),
            },
          });
          resolve(retryResponse);
        });
      });
    }
    
    // Start refresh process
    isRefreshing = true;
    
    try {
      const newToken = await performRefresh();
      
      if (newToken) {
        isRefreshing = false;
        notifySubscribers(newToken);

        // Retry the original request with new token
        const newDeviceId = decodeDeviceId(newToken);
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            ...(newDeviceId ? { 'x-device-id': newDeviceId } : {}),
          },
        });
      } else {
        // Refresh failed - clear tokens
        isRefreshing = false;
        refreshSubscribers = [];
        
        await clearUserDataAndRedirect(); // ✅ This emits the event
        throw new Error('SESSION_EXPIRED');
      }
    } catch (error) {
      isRefreshing = false;
      refreshSubscribers = [];
      
      // If session expired, throw specific error
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  return response;
};

/**
 * Simple API call without auth (for login, register, etc.)
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};