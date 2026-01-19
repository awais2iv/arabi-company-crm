// src/app/api/apiSlice.js - Avaya API Configuration
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenExpired } from '@/features/auth/authSlice';
import { isTokenExpired } from '@/utils/tokenUtils';
import Cookies from 'js-cookie';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;

    if (!token) {
      console.warn('⚠️ No token found in Redux state');
    }

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

// Clear persistent storage helper
const clearPersistentStorage = async () => {
  try {
    // Clear redux-persist storage
    localStorage.removeItem('persist:auth');
    
    // Clear cookies
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('otpToken');
    Cookies.remove('token');
    
    // Clear any auth-related items from localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('user')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Storage cleared');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Enhanced base query with auto-logout on token expiration
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Check if token is expired before making the request
  const token = api.getState().auth.token;

  if (token && isTokenExpired(token)) {
    // Token is expired, clear storage and logout
    await clearPersistentStorage();
    api.dispatch(tokenExpired());
    return {
      error: {
        status: 401,
        data: { message: 'Token expired' }
      }
    };
  }

  // Proceed with the request
  let result = await baseQuery(args, api, extraOptions);

  // Check if we got 401 or 403 response (unauthorized/forbidden)
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    const endpoint = typeof args === 'string' ? args : args.url;
    
    // Don't auto-logout on logout endpoint failures
    const isLogoutEndpoint = endpoint?.includes('/auth/logout');
    
    if (!isLogoutEndpoint) {
      console.error('❌ Authentication error:', {
        status: result.error.status,
        endpoint,
        message: result.error.data?.message
      });
      
      // Clear storage and logout
      await clearPersistentStorage();
      api.dispatch(tokenExpired());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth'],
  endpoints: (builder) => ({}),
});
