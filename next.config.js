/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Enable static file serving for uploaded files
  async headers() {
    return [
      {
        source: "/Workspaces/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/pdf",
          },
        ],
      },
    ]
  },
  // Configure static file serving
  async rewrites() {
    return [
      {
        source: "/Workspaces/:path*",
        destination: "/public/Workspaces/:path*",
      },
    ]
  },
  // Disable image optimization for PDF files
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
