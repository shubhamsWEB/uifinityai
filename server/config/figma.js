const config = require('./default');

module.exports = {
  baseURL: config.figmaAPI.baseURL,
  clientId: config.figmaAPI.clientId,
  clientSecret: config.figmaAPI.clientSecret,
  redirectUri: config.figmaAPI.redirectUri
};