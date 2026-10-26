// Reads configuration from environment variables.
// NEXT_PUBLIC_ values must be written out in full so Next.js can include them in the browser bundle.

export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. See SETUP.md.");
  return value;
}

export function supabasePublicKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See SETUP.md.");
  return value;
}

export function supabaseSecretKey(): string {
  const value = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Missing SUPABASE_SECRET_KEY. See SETUP.md.");
  return value;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function viewHashSalt(): string {
  return process.env.VIEW_HASH_SALT ?? supabaseSecretKey();
}
