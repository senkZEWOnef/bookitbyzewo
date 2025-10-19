/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  generateBuildId: () => 'build',
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  env: {
    DISABLE_STATIC_GENERATION: 'true'
  }
}

module.exports = nextConfig