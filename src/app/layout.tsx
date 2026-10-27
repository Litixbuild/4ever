import type { Metadata, Viewport } from "next";
import "@fontsource/metamorphous/400.css";
import "@fontsource/marcellus/400.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isSupabaseConfigured } from "@/lib/env";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configured = isSupabaseConfigured();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {configured ? <SiteHeader /> : null}
        <main id="main">
          {configured ? (
            children
          ) : (
            <div className="container page page-narrow">
              <div className="stack">
                <span className="eyebrow">Almost there</span>
                <h1 className="h1">4Everclips needs its database keys</h1>
                <p className="lead">
                  The site is running, but it isn&apos;t connected to Supabase yet. Add the environment variables from{" "}
                  <code>.env.example</code> in Netlify (Project configuration, Environment variables), then redeploy.
                  SETUP.md walks through every step.
                </p>
              </div>
            </div>
          )}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
