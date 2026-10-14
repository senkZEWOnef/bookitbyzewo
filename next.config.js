/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  env: {
    DISABLE_STATIC_GENERATION: 'true'
  }
}

module.exports = nextConfig