/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // R3F v8 has type incompatibility with React 19 JSX namespace
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}
module.exports = nextConfig
