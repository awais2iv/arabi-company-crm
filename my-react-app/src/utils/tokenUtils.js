// src/utils/tokenUtils.js - JWT Token Utilities
import { jwtDecode } from 'jwt-decode';

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    
    // Add 30 second buffer to handle clock skew
    return decoded.exp < currentTime + 30;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get time until token expires (in milliseconds)
 * @param {string} token - JWT token
 * @returns {number} - Milliseconds until expiration, or 0 if expired
 */
export const getTimeUntilExpiration = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;

  const timeUntilExp = expiration.getTime() - Date.now();
  return Math.max(0, timeUntilExp);
};
