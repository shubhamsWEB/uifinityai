const axios = require('axios');
const figmaConfig = require('../../config/figma');

class FigmaApiService {
  constructor() {
    this.apiClient = null;
    this.baseURL = figmaConfig.baseURL;
  }

  /**
   * Initialize the API client with an access token
   * @param {string} accessToken - Figma access token
   */
  initialize(accessToken) {
    this.apiClient = this.createApiClient(accessToken);
  }

  /**
   * Initialize with a personal access token
   * @param {string} personalAccessToken - Figma personal access token
   */
  initializeWithPersonalToken(personalAccessToken) {
    this.apiClient = this.createPersonalTokenClient(personalAccessToken);
  }

  /**
   * Create an authenticated Figma API client
   * @param {string} accessToken - The Figma access token
   * @returns {Object} An axios instance configured for Figma API
   */
  createApiClient(accessToken) {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Figma-Token': accessToken
      }
    });
  }

  /**
   * Create a client with a personal access token
   * @param {string} personalAccessToken - The personal access token
   * @returns {Object} An axios instance configured for Figma API
   */
  createPersonalTokenClient(personalAccessToken) {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Figma-Token': personalAccessToken
      }
    });
  }

  /**
   * Get file data from Figma
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The file data
   */
  async getFile(fileKey) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/files/${fileKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      throw error;
    }
  }

  /**
   * Get style data from Figma
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The styles data
   */
  async getFileStyles(fileKey) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/files/${fileKey}/styles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma styles:', error);
      throw error;
    }
  }

  /**
   * Get component data from Figma
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The components data
   */
  async getFileComponents(fileKey) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/files/${fileKey}/components`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma components:', error);
      throw error;
    }
  }

  /**
   * Get component set data from Figma
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<Object>} The component sets data
   */
  async getComponentSets(fileKey) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/files/${fileKey}/component_sets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma component sets:', error);
      throw error;
    }
  }

  /**
   * Get node data for specific nodes
   * @param {string} fileKey - The Figma file key
   * @param {string[]} nodeIds - Array of node IDs to fetch
   * @returns {Promise<Object>} The nodes data
   */
  async getNodes(fileKey, nodeIds) {
    this.validateClient();
    try {
      if (!nodeIds || nodeIds.length === 0) {
        return { nodes: {} };
      }
      
      // Figma API limits the number of IDs per request, so we may need to chunk
      const maxIdsPerRequest = 100;
      if (nodeIds.length <= maxIdsPerRequest) {
        const nodeIdsParam = nodeIds.join(',');
        const response = await this.apiClient.get(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
        return response.data;
      } else {
        // Handle large requests by breaking them into chunks
        const chunks = this.chunkArray(nodeIds, maxIdsPerRequest);
        const results = { nodes: {} };
        
        for (const chunk of chunks) {
          const nodeIdsParam = chunk.join(',');
          const response = await this.apiClient.get(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
          
          // Merge the chunk results
          results.nodes = { ...results.nodes, ...response.data.nodes };
        }
        
        return results;
      }
    } catch (error) {
      console.error('Error fetching Figma nodes:', error);
      throw error;
    }
  }

  /**
   * Split an array into chunks of specified size
   * @private
   * @param {Array} array - The array to chunk
   * @param {number} chunkSize - The size of each chunk
   * @returns {Array} Array of chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get image URLs for nodes
   * @param {string} fileKey - The Figma file key
   * @param {string[]} nodeIds - Array of node IDs to get images for
   * @param {string} format - Image format (png, jpg, svg, pdf)
   * @param {number} scale - Image scale (1, 2, 3, 4)
   * @returns {Promise<Object>} The image URLs
   */
  async getImages(fileKey, nodeIds, format = 'png', scale = 1) {
    this.validateClient();
    try {
      if (!nodeIds || nodeIds.length === 0) {
        return { images: {} };
      }
      
      // Figma API limits the number of IDs per request, so we may need to chunk
      const maxIdsPerRequest = 100;
      if (nodeIds.length <= maxIdsPerRequest) {
        const nodeIdsParam = nodeIds.join(',');
        const response = await this.apiClient.get(
          `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`
        );
        return response.data;
      } else {
        // Handle large requests by breaking them into chunks
        const chunks = this.chunkArray(nodeIds, maxIdsPerRequest);
        const results = { images: {} };
        
        for (const chunk of chunks) {
          const nodeIdsParam = chunk.join(',');
          const response = await this.apiClient.get(
            `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`
          );
          
          // Merge the chunk results
          results.images = { ...results.images, ...response.data.images };
        }
        
        return results;
      }
    } catch (error) {
      console.error('Error fetching Figma images:', error);
      throw error;
    }
  }

  /**
   * Validate that the API client is initialized
   * @private
   */
  validateClient() {
    if (!this.apiClient) {
      throw new Error('Figma API client not initialized. Call initialize() or initializeWithPersonalToken() first.');
    }
  }

  /**
   * Get user information
   * @returns {Promise<Object>} User data
   */
  async getUser() {
    this.validateClient();
    try {
      const response = await this.apiClient.get('/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Get team projects
   * @param {string} teamId - The team ID
   * @returns {Promise<Object>} Team projects
   */
  async getTeamProjects(teamId) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/teams/${teamId}/projects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team projects:', error);
      throw error;
    }
  }

  /**
   * Get project files
   * @param {string} projectId - The project ID
   * @returns {Promise<Object>} Project files
   */
  async getProjectFiles(projectId) {
    this.validateClient();
    try {
      const response = await this.apiClient.get(`/projects/${projectId}/files`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }
  }
}

module.exports = new FigmaApiService();