/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions is now an object
    serverActions: {
      bodySizeLimit: '2mb', // Example: Increase body size limit to 2MB
    },
  },
}

module.exports = nextConfig