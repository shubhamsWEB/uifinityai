import { handleApiResponse } from '@/lib/utils/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export async function register(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  return handleApiResponse(response);
}

/**
 * Login a user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login response with token
 */
export async function login(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  const data = await handleApiResponse(response);
  
  // Store the token in localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
}

/**
 * Logout the current user
 */
export function logout() {
  localStorage.removeItem('token');
  // You might also want to call a logout endpoint
  // Optional: Call the backend to invalidate the token
}

/**
 * Get the current user profile
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUser() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Check if the user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}