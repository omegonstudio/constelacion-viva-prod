/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      // LocalStack (dev)
      { protocol: "http", hostname: "localhost", port: "4566", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4566", pathname: "/**" },
      { protocol: "http", hostname: "s3.localhost.localstack.cloud", pathname: "/**" },

      // S3 (prod / managed S3-compatible)
      { protocol: "https", hostname: "s3.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
    ],
  },
}

export default nextConfig