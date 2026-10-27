import { NextResponse, type NextRequest } from "next/server";
import { awardBadge, syncTwitchChannel } from "@/lib/awards";
import { adminEmails } from "@/lib/env";
import { safeNextPath } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Turns the login service's error into something a person can act on.
function friendlyLoginError(error: string, code: string | null, description: string | null): string {
  if (error === "access_denied") return "Login was cancelled.";
  if (code === "provider_email_needs_verification") {
    return "That account's email isn't verified yet. Verify it with the service first (in Discord: User Settings → My Account), then log in again.";
  }
  if (code === "signup_disabled") return "New sign-ups are paused right now. Please check back soon.";
  return description ?? "Something went wrong logging in. Please try again.";
}

// Discord, Twitch and Google send people back here after they log in.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const next = safeNextPath(searchParams.get("next"), "/");

  const loginError = searchParams.get("error");
  if (loginError) {
    const reason = friendlyLoginError(
      loginError,
      searchParams.get("error_code"),
      searchParams.get("error_description"),
    );
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}&next=${encodeURIComponent(next)}`);
  }

  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("That login link expired. Please try again.")}&next=${encodeURIComponent(next)}`,
    );
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

  const destination = twitchError
    ? `/settings?notice=${encodeURIComponent(twitchError)}`
    : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
