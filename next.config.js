/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['react', 'react-dom'],
  },

  // Turbopack config (required when webpack config is present)
  turbopack: {},

  // Webpack optimizations for dev
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable filesystem caching
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
