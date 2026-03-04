/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  eslint: {
    // Security note: prefer failing the build on lint errors in CI/CD.
    ignoreDuringBuilds: false,
  },

  typescript: {
    // Security note: prefer failing the build on type errors in CI/CD.
    ignoreBuildErrors: false,
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

  async headers() {
    const isProd = process.env.NODE_ENV === "production"

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      // Keeping CSP in Report-Only to avoid breaking GTM/gtag (inline scripts).
      // Migrate to a nonce-based strict CSP once analytics is wired accordingly.
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "img-src 'self' data: https:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
          "connect-src 'self' https:",
          "frame-src https://www.googletagmanager.com",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : []),
    ]

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig