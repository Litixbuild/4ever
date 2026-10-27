import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Emblem } from "@/components/brand";
import { LoginButtons } from "@/components/login-buttons";
import { getViewer } from "@/lib/auth";
import { enabledProviders } from "@/lib/auth-providers";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/");
  const [viewer, providers] = await Promise.all([getViewer(), enabledProviders()]);
  if (viewer) redirect(next);

  return (
    <div className="container page" style={{ alignItems: "center" }}>
      <div className="card stack-lg" style={{ width: "100%", maxWidth: 440, padding: 32 }}>
        <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
          <Emblem size={40} />
          <h1 className="h2">Welcome back to Azeroth</h1>
          <p className="muted" style={{ margin: 0 }}>
            Log in to submit clips, vote, comment, and get credit for your work. No passwords here, just the
            account you already use.
          </p>
        </div>
        {params.error ? (
          <p className="notice notice-error" role="alert">
            {params.error.slice(0, 200)}
          </p>
        ) : null}
        {providers.length > 0 ? (
          <LoginButtons next={next} providers={providers} />
        ) : (
          <p className="notice notice-warn" role="status">
            Logins aren&apos;t open yet. Check back soon.
          </p>
        )}
        <p className="tiny muted" style={{ margin: 0, textAlign: "center" }}>
          By logging in you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy</Link>{" "}
          notes. We only keep your name, avatar and email from the login.
        </p>
      </div>
    </div>
  );
}
