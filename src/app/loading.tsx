// Shown while a page loads: the game's loading bar, filling over the backdrop art.
export default function Loading() {
  return (
    <div className="container page loading-page" role="status" aria-label="Loading">
      <div className="loading-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
