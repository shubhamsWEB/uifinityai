const axios = require('axios');
const figmaConfig = require('../../config/figma');

class FigmaAuthService {
  constructor() {
    this.clientId = figmaConfig.clientId;
    this.clientSecret = figmaConfig.clientSecret;
    this.redirectUri = figmaConfig.redirectUri;
  }

  /**
   * Generate the OAuth URL for Figma login
   * @returns {string} The authorization URL
   */
  getAuthorizationUrl() {
    const scopes = ['files:read'];
    
    return `https://www.figma.com/oauth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${this.generateState()}&response_type=code`;
  }

  /**
   * Generate a random state parameter to prevent CSRF attacks
   * @returns {string} A random state string
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Exchange authorization code for an access token
   * @param {string} code - The authorization code from Figma
   * @returns {Promise<Object>} The access token response
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://www.figma.com/api/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
        grant_type: 'authorization_code'
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Refresh an expired token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} The new token response
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post('https://www.figma.com/api/oauth/refresh', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Verify a personal access token
   * @param {string} personalAccessToken - The token to verify
   * @returns {Promise<boolean>} Whether the token is valid
   */
  async verifyPersonalToken(personalAccessToken) {
    try {
      const response = await axios.get('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': personalAccessToken
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}

module.exports = new FigmaAuthService();