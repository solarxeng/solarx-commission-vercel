/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [] },
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
