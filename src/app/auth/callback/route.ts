import { NextResponse, type NextRequest } from "next/server";
import { awardBadge, syncTwitchChannel } from "@/lib/awards";
import { adminEmails } from "@/lib/env";
import { safeNextPath } from "@/lib/format";
import type { LoginErrorCode } from "@/lib/login-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Turns the login service's error into one of the login page's own messages.
function loginErrorCode(error: string, code: string | null): LoginErrorCode {
  if (error === "access_denied") return "cancelled";
  if (code === "provider_email_needs_verification") return "unverified";
  if (code === "signup_disabled") return "signups_paused";
  return "failed";
}

// Discord, Twitch and Google send people back here after they log in.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const next = safeNextPath(searchParams.get("next"), "/");

  const loginError = searchParams.get("error");
  if (loginError) {
    const reason = loginErrorCode(loginError, searchParams.get("error_code"));
    return NextResponse.redirect(`${origin}/login?error=${reason}&next=${encodeURIComponent(next)}`);
  }

  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=expired&next=${encodeURIComponent(next)}`);
  }

  const user = data.user;

  // People listed in ADMIN_EMAILS become admins automatically, but only when the login
  // provider confirms they own that email. Otherwise someone could sign up elsewhere with
  // your address and claim admin. (SETUP.md has a one-line SQL fallback.)
  const email = user.email?.toLowerCase();
  const emailVerified =
    Boolean(user.email_confirmed_at) &&
    (user.identities ?? []).some(
      (identity) =>
        String(identity.identity_data?.email ?? "").toLowerCase() === email &&
        identity.identity_data?.email_verified === true,
    );
  if (email && emailVerified && adminEmails().includes(email)) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ role: "admin" }).eq("id", user.id).neq("role", "admin");
    await awardBadge(user.id, "curator");
  }

  // Logging in with Twitch proves you own that Twitch channel.
  let twitchError: string | null = null;
  try {
    twitchError = await syncTwitchChannel(user.id, user.identities);
  } catch {
    twitchError = null;
  }

  const destination = twitchError ? `/settings?notice=${encodeURIComponent(twitchError)}` : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
