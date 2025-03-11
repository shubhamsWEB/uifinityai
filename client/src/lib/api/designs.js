// client/src/lib/api/designs.js
import { handleApiResponse } from '@/lib/utils/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Generate a design from a prompt
 * @param {Object} data - Request data
 * @param {string} data.prompt - User's prompt
 * @param {string} data.designSystemId - ID of the design system to use
 * @returns {Promise<Object>} Generated design data
 */
export async function generateDesign(data) {
  const response = await fetch(`${API_BASE_URL}/designs`, {
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
 * Get a generated design by ID
 * @param {string} id - Generated design ID
 * @returns {Promise<Object>} Generated design data
 */
export async function getGeneratedDesign(id) {
  const response = await fetch(`${API_BASE_URL}/designs/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Get all generated designs
 * @returns {Promise<Object>} List of generated designs
 */
export async function getAllGeneratedDesigns() {
  const response = await fetch(`${API_BASE_URL}/designs`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Provide feedback on a generated design
 * @param {string} id - Generated design ID
 * @param {Object} data - Feedback data
 * @param {string} data.feedback - User feedback
 * @param {number} data.rating - Rating (1-5)
 * @returns {Promise<Object>} Response
 */
export async function provideFeedback(id, data) {
  const response = await fetch(`${API_BASE_URL}/designs/${id}/feedback`, {
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
 * Regenerate a design
 * @param {string} id - Generated design ID
 * @param {Object} data - Regeneration options
 * @param {string} data.prompt - Optional new prompt
 * @returns {Promise<Object>} Regenerated design
 */
export async function regenerateDesign(id, data) {
  const response = await fetch(`${API_BASE_URL}/designs/${id}/regenerate`, {
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
 * Delete a generated design
 * @param {string} id - Generated design ID
 * @returns {Promise<Object>} Response
 */
export async function deleteGeneratedDesign(id) {
  const response = await fetch(`${API_BASE_URL}/designs/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Get the URL for a design preview
 * @param {string} id - Generated design ID
 * @returns {string} Preview URL
 */
export function getDesignPreviewUrl(id) {
  return `${API_BASE_URL}/designs/preview/${id}`;
}