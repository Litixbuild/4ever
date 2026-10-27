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
    <div className="container page" style={{ alignItems: "center", paddingTop: 56 }}>
      <section className="dialog login-dialog" aria-labelledby="login-title">
        <Emblem size={46} />
        <h1 id="login-title" className="dialog-title">
          Log in to 4Ever
        </h1>
        <p>
          Submit clips, vote, comment, and get credit for your work. No passwords here, just the account you already
          use.
        </p>
        {params.error ? (
          <p className="notice notice-error" role="alert" style={{ textAlign: "left" }}>
            {params.error.slice(0, 200)}
          </p>
        ) : null}
        <div style={{ width: "100%", marginTop: 6 }}>
          {providers.length > 0 ? (
            <LoginButtons next={next} providers={providers} />
          ) : (
            <p className="notice notice-warn" role="status">
              Logins aren&apos;t open yet. Check back soon.
            </p>
          )}
        </div>
        <p className="tiny muted" style={{ marginTop: 4 }}>
          By logging in you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy</Link>{" "}
          notes. We only keep your name, avatar and email from the login.
        </p>
      </section>
    </div>
  );
}
