/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  generateBuildId: () => 'build',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    DISABLE_STATIC_GENERATION: 'true'
  }
}

module.exports = nextConfig