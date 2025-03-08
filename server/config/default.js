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
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 2525,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      fromEmail: process.env.EMAIL_FROM || 'noreply@figmaaiui.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Figma AI UI'
    }
  };