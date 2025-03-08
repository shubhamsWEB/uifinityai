/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for improved development experience
    reactStrictMode: true,
    
    // Configure image domains for external images (like Figma image URLs)
    images: {
      domains: ['s3.us-west-2.amazonaws.com', 'figma-alpha-api.s3.us-west-2.amazonaws.com'],
    },
    
    // API route configuration
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 
            process.env.NODE_ENV === 'development'
              ? 'http://localhost:5000/api/:path*'
              : '/api/:path*',
        },
      ];
    },
    
    // Headers to handle CORS issues during development
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;