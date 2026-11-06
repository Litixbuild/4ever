// Runs every hour on Netlify (scheduled functions are included in every plan) and asks the site to
// look on YouTube for brand new WoW Forever clips. YouTube only; see src/lib/clip-finder.ts.
import { createHash } from "node:crypto";

export default async function findClips() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const site = process.env.URL;
  if (!secret || !site) return new Response("Not configured", { status: 500 });
  const token = createHash("sha256").update(`${secret}:find-clips`).digest("hex");
  const res = await fetch(`${site}/api/cron/find-clips`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`find-clips: ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config = { schedule: "5 * * * *" };
