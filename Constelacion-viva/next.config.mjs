/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

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

      // DigitalOcean Spaces (SFO3)
      { protocol: "https", hostname: "constelacion-viva-prod.sfo3.digitaloceanspaces.com", pathname: "/**" },

      // AWS generic fallback
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
    ],
  },
}

export default nextConfig