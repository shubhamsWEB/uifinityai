/**
 * Format success response
 * @param {Object} data - The data to return
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted response
 */
const successResponse = (data, statusCode = 200) => {
    return {
      success: true,
      data,
      statusCode
    };
  };
  
  /**
   * Format error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Formatted error response
   */
  const errorResponse = (message, statusCode = 500) => {
    return {
      success: false,
      error: message,
      statusCode
    };
  };
  
  module.exports = {
    successResponse,
    errorResponse
  };