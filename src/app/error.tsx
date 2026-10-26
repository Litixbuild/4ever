"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page page-narrow">
      <div className="empty" style={{ padding: "64px 24px" }}>
        <span className="eyebrow">Something broke</span>
        <h1 className="h2">That didn&apos;t work</h1>
        <p className="muted" style={{ margin: 0, maxWidth: 480 }}>
          {error.message && error.message.length < 200 && !error.digest
            ? error.message
            : "Something went wrong on our side. Try again, and if it keeps happening, let us know."}
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-gold" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Front page
          </Link>
        </div>
      </div>
    </div>
  );
}
