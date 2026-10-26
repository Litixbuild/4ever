import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page page-narrow">
      <div className="empty" style={{ padding: "64px 24px" }}>
        <span className="eyebrow">Lost in the Barrens</span>
        <h1 className="h2">This page wandered off</h1>
        <p className="muted" style={{ margin: 0, maxWidth: 460 }}>
          The video may have been removed, or the link has a typo. Head back to the front page and try again.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-gold">
            Back to the front page
          </Link>
          <Link href="/browse" className="btn btn-ghost">
            Browse clips
          </Link>
        </div>
      </div>
    </div>
  );
}
