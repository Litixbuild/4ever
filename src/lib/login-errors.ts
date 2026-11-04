// The login page only ever shows one of these messages, picked by a short code in the link
// (/login?error=cancelled). It never prints text taken from the link itself, so nobody can send
// people a 4Ever login link that shows a message they wrote.
export const LOGIN_ERRORS = {
  cancelled: "Login was cancelled.",
  unverified:
    "That account's email isn't verified yet. Verify it with the service first (in Discord: User Settings → My Account), then log in again.",
  signups_paused: "New sign-ups are paused right now. Please check back soon.",
  expired: "That login link expired. Please try again.",
  failed: "Something went wrong logging in. Please try again.",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERRORS;

export function loginErrorMessage(code: string | undefined | null): string | null {
  if (!code) return null;
  return Object.hasOwn(LOGIN_ERRORS, code) ? LOGIN_ERRORS[code as LoginErrorCode] : LOGIN_ERRORS.failed;
}
