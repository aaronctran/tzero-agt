const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Preserve existing aliases and add our custom path aliases
    // This ensures path resolution works in both local and Docker environments
    const existingAliases = config.resolve.alias || {}
    
    config.resolve.alias = {
      ...existingAliases,
      '@': path.resolve(__dirname),
    }
    
    // Ensure modules are resolved correctly
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname),
      'node_modules',
    ]
    
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.tzero.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tzero.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
