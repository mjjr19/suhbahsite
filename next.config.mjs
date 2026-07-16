/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "sanity",
      "@sanity/vision",
      "@sanity/ui",
      "@sanity/icons",
      "styled-components",
    ],
  },
};

export default nextConfig;
