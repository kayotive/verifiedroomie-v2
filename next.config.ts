import type { NextConfig } from "next";

const securityHeaders = [
  // Stops browsers guessing file types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Stops other sites showing yours inside a frame (link mirroring / clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Sends less information to other sites when people click links
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera is allowed on your own site (for "Take a photo"); other features are off
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(self)" },
  // A safe, light Content Security Policy. It does not block scripts or images,
  // so it cannot break the site. A stricter one can be added later.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;