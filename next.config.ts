import type { NextConfig } from "next";

// Security headers sent with every page.
// frame-src lists the only players 4Ever embeds: YouTube (privacy mode) and Twitch.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://clips.twitch.tv https://player.twitch.tv",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
