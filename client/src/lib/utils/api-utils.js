/**
 * Handle API response and parse JSON or throw error
 * @param {Response} response - Fetch API response
 * @returns {Promise<Object>} Parsed response data
 */
export async function handleApiResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  }
  
  /**
   * Create an API request with authentication
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  export async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  }