"use client";

import Link from "next/link";

// Shown when a page fails to load, styled after the game's disconnect dialog.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page page-narrow" style={{ alignItems: "center", paddingTop: 72 }}>
      <section className="dialog" aria-labelledby="error-title" role="alert">
        <h1 id="error-title" className="dialog-title">
          Disconnected
        </h1>
        <p>
          {error.message && error.message.length < 200 && !error.digest
            ? error.message
            : "This page didn't load. It's a problem on our side. Try again, and if it keeps happening, let us know."}
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-wow btn-lg" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="btn btn-ghost btn-lg">
            Front page
          </Link>
        </div>
      </section>
    </div>
  );
}
