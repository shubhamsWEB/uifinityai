module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE,
    figmaAPI: {
      baseURL: 'https://api.figma.com/v1',
      clientId: process.env.FIGMA_CLIENT_ID,
      clientSecret: process.env.FIGMA_CLIENT_SECRET,
      redirectUri: process.env.FIGMA_REDIRECT_URI
    }
  };