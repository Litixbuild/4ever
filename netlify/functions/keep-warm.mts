// Netlify shuts the site's server down when nobody has visited for a while, and the next visitor waits a
// few seconds while it starts again. A light visit every five minutes keeps it awake.
// (Scheduled functions are included in the Netlify plan; this is about 8,600 small calls a month.)
export default async function keepWarm() {
  const site = process.env.URL;
  if (!site) return new Response("Not configured", { status: 500 });
  const started = Date.now();
  const res = await fetch(`${site}/creators`, { headers: { "user-agent": "4ever-keep-warm" } });
  await res.arrayBuffer();
  return new Response(`${res.status} in ${Date.now() - started}ms`);
}

export const config = { schedule: "*/5 * * * *" };
