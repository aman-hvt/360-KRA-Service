/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: "standalone",
  output: "export",        // Must have this line!
  trailingSlash: true,
}

export default nextConfig
