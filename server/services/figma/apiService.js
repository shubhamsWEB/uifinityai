// server/services/figma/apiService.js
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
      console.log(`Fetching Figma file: ${fileKey}`);
      const response = await this.apiClient.get(`/files/${fileKey}`);
      console.log(`Successfully retrieved file: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma file:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to fetch Figma file: ${error.message}`);
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
      console.log(`Fetching styles for file: ${fileKey}`);
      const response = await this.apiClient.get(`/files/${fileKey}/styles`);
      console.log(`Retrieved ${response.data.meta?.styles?.length || 0} styles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma styles:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      // Return minimal structure instead of throwing
      return {
        styles: []
      };
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
      console.log(`Fetching components for file: ${fileKey}`);
      const response = await this.apiClient.get(`/files/${fileKey}`);
      console.log(`Retrieved ${response?.data?.components?.length || 0} components`);
      // log and store the response in temp file for debugging      
      // Ensure we have the expected structure
      if (!response?.data?.components) {
        response.data.components = [];
        response.data.componentSets = [];
      }
      
      return {
        meta: {
          components: response?.data?.components || [],
          component_sets: response?.data?.componentSets || []
        }
      };
    } catch (error) {
      console.error('Error fetching Figma components:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to fetch Figma components: ${error.message}`);
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
      console.log(`Fetching component sets for file: ${fileKey}`);
      const response = await this.apiClient.get(`/files/${fileKey}/component_sets`);
      console.log(`Retrieved ${response.data.meta?.component_sets?.length || 0} component sets`);
      
      // Ensure we have the expected structure
      if (!response.data.meta) {
        response.data.meta = {};
      }
      if (!response.data.meta.component_sets) {
        response.data.meta.component_sets = [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma component sets:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      // Return minimal structure instead of throwing
      return {
        meta: {
          component_sets: []
        }
      };
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
      
      console.log(`Fetching ${nodeIds.length} nodes for file: ${fileKey}`);
      
      // Figma API limits the number of IDs per request
      const maxIdsPerRequest = 100;
      if (nodeIds.length <= maxIdsPerRequest) {
        const nodeIdsParam = nodeIds.join(',');
        const response = await this.apiClient.get(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
        console.log(`Retrieved ${Object.keys(response.data.nodes || {}).length} nodes`);
        
        // Ensure we have the expected structure
        if (!response.data.nodes) {
          response.data.nodes = {};
        }
        
        return response.data;
      } else {
        // Handle large requests by breaking them into chunks
        console.log(`Breaking ${nodeIds.length} nodes into chunks of ${maxIdsPerRequest}`);
        const chunks = this.chunkArray(nodeIds, maxIdsPerRequest);
        const results = { nodes: {} };
        
        for (const chunk of chunks) {
          try {
            const nodeIdsParam = chunk.join(',');
            const response = await this.apiClient.get(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
            
            // Merge the chunk results
            if (response.data && response.data.nodes) {
              Object.assign(results.nodes, response.data.nodes);
            }
          } catch (chunkError) {
            console.error(`Error fetching chunk of nodes: ${chunkError.message}`);
            // Continue to the next chunk instead of failing completely
          }
        }
        
        console.log(`Retrieved a total of ${Object.keys(results.nodes).length} nodes after processing all chunks`);
        return results;
      }
    } catch (error) {
      console.error('Error fetching Figma nodes:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      // Return empty result instead of throwing to prevent cascading failures
      return { nodes: {} };
    }
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
      
      console.log(`Fetching images for ${nodeIds.length} nodes in file: ${fileKey}`);
      
      // Figma API limits the number of IDs per request, so we may need to chunk
      const maxIdsPerRequest = 100;
      if (nodeIds.length <= maxIdsPerRequest) {
        const nodeIdsParam = nodeIds.join(',');
        const response = await this.apiClient.get(
          `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`
        );
        console.log(`Retrieved ${Object.keys(response.data.images || {}).length} images`);
        
        // Ensure we have the expected structure
        if (!response.data.images) {
          response.data.images = {};
        }
        
        return response.data;
      } else {
        // Handle large requests by breaking them into chunks
        console.log(`Breaking ${nodeIds.length} image requests into chunks of ${maxIdsPerRequest}`);
        const chunks = this.chunkArray(nodeIds, maxIdsPerRequest);
        const results = { images: {} };
        
        for (const chunk of chunks) {
          try {
            const nodeIdsParam = chunk.join(',');
            const response = await this.apiClient.get(
              `/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`
            );
            
            // Merge the chunk results
            if (response.data && response.data.images) {
              Object.assign(results.images, response.data.images);
            }
          } catch (chunkError) {
            console.error(`Error fetching chunk of images: ${chunkError.message}`);
            // Continue to the next chunk instead of failing completely
          }
        }
        
        console.log(`Retrieved a total of ${Object.keys(results.images).length} images after processing all chunks`);
        return results;
      }
    } catch (error) {
      console.error('Error fetching Figma images:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      // Return empty result instead of throwing to prevent cascading failures
      return { images: {} };
    }
  }

  /**
   * Validate that the API client is initialized
   * @private
   */
  validateClient() {
    if (!this.apiClient) {
      console.error('Figma API client not initialized. Call initialize() or initializeWithPersonalToken() first.');
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
      console.error('Error fetching user data:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
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
      console.error('Error fetching team projects:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
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
      console.error('Error fetching project files:', error.message);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
}

module.exports = new FigmaApiService();