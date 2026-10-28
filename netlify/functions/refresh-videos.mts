// Runs once a day on Netlify (scheduled functions are included in every plan) and asks the site to
// refresh stored video details, as YouTube's developer rules require every 30 days.
import { createHash } from "node:crypto";

export default async function refreshVideos() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const site = process.env.URL;
  if (!secret || !site) return new Response("Not configured", { status: 500 });
  const token = createHash("sha256").update(`${secret}:refresh-videos`).digest("hex");
  const res = await fetch(`${site}/api/cron/refresh-videos`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`refresh-videos: ${res.status} ${body}`);
  return new Response(body, { status: res.status });
}

export const config = { schedule: "@daily" };
