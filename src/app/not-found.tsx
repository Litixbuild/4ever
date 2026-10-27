import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

// A missing page is a dead one: the world goes gray, and the way out is to release your spirit.
export default function NotFound() {
  return (
    <>
      <div className="ghost-world" aria-hidden="true" />
      <div className="container page page-narrow" style={{ alignItems: "center", paddingTop: 72 }}>
        <section className="dialog" aria-labelledby="dead-title">
          <h1 id="dead-title" className="dialog-title">
            This page has died
          </h1>
          <p>The link may be old, or the video was taken down. Release your spirit and run back to the front page.</p>
          <div className="dialog-actions">
            <Link href="/" className="btn btn-wow btn-lg">
              Release Spirit
            </Link>
            <Link href="/browse" className="btn btn-ghost btn-lg">
              Browse clips
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
