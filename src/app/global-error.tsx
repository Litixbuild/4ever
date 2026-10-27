"use client";

import "@fontsource/marcellus/400.css";
import "@fontsource-variable/manrope";
import "./globals.css";

// Last line of defense when the whole site fails to render, header included.
// Styled after the game's disconnect dialog, like the regular error page.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main id="main" className="container page page-narrow" style={{ alignItems: "center", paddingTop: 96 }}>
          <section className="dialog" aria-labelledby="error-title" role="alert">
            <h1 id="error-title" className="dialog-title">
              Disconnected
            </h1>
            <p>4Ever didn&apos;t load. It&apos;s a problem on our side and usually clears up in a minute.</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-wow btn-lg" onClick={() => reset()}>
                Try again
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
