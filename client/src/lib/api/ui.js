// client/src/lib/api/ui.js
import { handleApiResponse } from '@/lib/utils/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Generate UI from a prompt
 * @param {Object} data - Request data
 * @param {string} data.prompt - User's prompt
 * @param {string} data.designSystemId - ID of the design system to use
 * @param {string} data.framework - Target framework (react, next)
 * @param {string} data.styleLibrary - Target style library (tailwind, chakra, styled-components)
 * @returns {Promise<Object>} Generated UI data
 */
export async function generateUI(data) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  
  return handleApiResponse(response);
}

/**
 * Get a generated UI by ID
 * @param {string} id - Generated UI ID
 * @returns {Promise<Object>} Generated UI data
 */
export async function getGeneratedUI(id) {
  const response = await fetch(`${API_BASE_URL}/ai/generate/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Get all generated UIs
 * @returns {Promise<Object>} List of generated UIs
 */
export async function getGeneratedUIs() {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Provide feedback on a generated UI
 * @param {string} id - Generated UI ID
 * @param {Object} data - Feedback data
 * @param {string} data.feedback - User feedback
 * @param {number} data.rating - Rating (1-5)
 * @returns {Promise<Object>} Response
 */
export async function provideFeedback(id, data) {
  const response = await fetch(`${API_BASE_URL}/ai/generate/${id}/feedback`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  
  return handleApiResponse(response);
}

/**
 * Regenerate UI with different options
 * @param {string} id - Generated UI ID
 * @param {Object} data - Regeneration options
 * @param {string} data.framework - Target framework (react, next)
 * @param {string} data.styleLibrary - Target style library (tailwind, chakra, styled-components)
 * @returns {Promise<Object>} Regenerated UI
 */
export async function regenerateUI(id, data) {
  const response = await fetch(`${API_BASE_URL}/ai/generate/${id}/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  
  return handleApiResponse(response);
}

/**
 * Refine UI with feedback
 * @param {string} id - Generated UI ID
 * @param {Object} data - Refinement data
 * @param {string} data.feedback - Feedback for refinement
 * @returns {Promise<Object>} Refined UI
 */
export async function refineUI(id, data) {
  const response = await fetch(`${API_BASE_URL}/ai/generate/${id}/refine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  
  return handleApiResponse(response);
}

/**
 * Delete a generated UI
 * @param {string} id - Generated UI ID
 * @returns {Promise<Object>} Response
 */
export async function deleteGeneratedUI(id) {
  const response = await fetch(`${API_BASE_URL}/ai/generate/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}