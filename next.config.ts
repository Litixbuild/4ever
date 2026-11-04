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

// The site lives at 4ever.watch. Anyone who opens the old Netlify address (or www.) is sent there,
// keeping the rest of the link, so old shares and bookmarks still work.
// That includes every Netlify address for the project: wc4ever.netlify.app plus the per-deploy and
// branch ones like main--wc4ever.netlify.app, where logins can't work (each address keeps its own login).
const OLD_HOSTS = ["(?:.+--)?wc4ever\\.netlify\\.app", "www\\.4ever\\.watch"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://4ever.watch/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
