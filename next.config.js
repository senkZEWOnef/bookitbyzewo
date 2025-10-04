/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  experimental: {
    serverComponentsExternalPackages: ['pg']
  }
}

module.exports = nextConfig