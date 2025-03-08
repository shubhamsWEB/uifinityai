import { handleApiResponse } from '@/lib/utils/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Authenticate with Figma using a personal access token
 * @param {string} token - Figma personal access token
 * @returns {Promise<Object>} Authentication response
 */
export async function authenticateFigma(token) {
  const response = await fetch(`${API_BASE_URL}/figma/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ token })
  });
  
  return handleApiResponse(response);
}

/**
 * Upload a design system from Figma
 * @param {string} fileKey - Figma file key
 * @param {string} token - Figma personal access token
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} The uploaded design system
 */
export async function uploadFigmaDesignSystem(fileKey, token, progressCallback) {
  // First authenticate with Figma
  await authenticateFigma(token);
  
  // Then extract and save the design system
  const response = await fetch(`${API_BASE_URL}/figma/extract-and-save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ fileKey, token })
  });
  
  // Update progress (simulate progress since we don't have real-time updates)
  if (progressCallback) {
    const mockProgress = () => {
      for (let i = 0; i <= 100; i += 10) {
        setTimeout(() => progressCallback(i / 100), i * 50);
      }
    };
    mockProgress();
  }
  
  const data = await handleApiResponse(response);
  return data.designSystem;
}

/**
 * Get all design systems for the current user
 * @returns {Promise<Object>} Design systems
 */
export async function getDesignSystems() {
  const response = await fetch(`${API_BASE_URL}/figma/design-systems`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Get a design system by ID
 * @param {string} id - Design system ID
 * @returns {Promise<Object>} Design system
 */
export async function getDesignSystemById(id) {
  const response = await fetch(`${API_BASE_URL}/figma/design-systems/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Export a design system as JSON
 * @param {string} id - Design system ID
 * @returns {Promise<Object>} Design system JSON
 */
export async function exportDesignSystem(id) {
  const response = await fetch(`${API_BASE_URL}/figma/export/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}

/**
 * Import a design system from JSON
 * @param {Object} designSystem - Design system data
 * @returns {Promise<Object>} Imported design system
 */
export async function importDesignSystem(designSystem) {
  const response = await fetch(`${API_BASE_URL}/figma/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ designSystem })
  });
  
  const data = await handleApiResponse(response);
  return data.designSystem;
}

/**
 * Delete a design system
 * @param {string} id - Design system ID
 * @returns {Promise<Object>} Response
 */
export async function deleteDesignSystem(id) {
  const response = await fetch(`${API_BASE_URL}/figma/design-systems/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return handleApiResponse(response);
}