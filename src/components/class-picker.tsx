"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { saveRoll } from "@/app/actions/roll";
import { CLASSES, SPEC_INFO, classColor, classIcon, specsFor } from "@/lib/wow";

export const OPEN_CLASS_PICKER = "4ever:choose-class";

type Stage = "class" | "spec" | "done";

// "Choose your class", then "choose your spec", like stepping up to the character screen.
// Opens on its own the first time someone logs in (`autoOpen`); anywhere else on the site can
// open it again with a window event (OPEN_CLASS_PICKER).
export function ClassPicker({ name, autoOpen }: { name: string; autoOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [stage, setStage] = useState<Stage>("class");
  const [picked, setPicked] = useState<string | null>(null);
  const [spec, setSpec] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timers = useRef<number[]>([]);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOpen() {
      setStage("class");
      setPicked(null);
      setSpec(null);
      setError(null);
      setLeaving(false);
      setOpen(true);
    }
    window.addEventListener(OPEN_CLASS_PICKER, onOpen);
    const queued = timers.current;
    return () => {
      window.removeEventListener(OPEN_CLASS_PICKER, onOpen);
      queued.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // While it's open the page behind it stays still, and focus starts inside it.
  useEffect(() => {
    if (!open) return;
    const body = document.body.style;
    const previous = body.overflow;
    body.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      body.overflow = previous;
    };
  }, [open, stage]);

  function later(fn: () => void, ms: number) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(window.setTimeout(fn, reduced ? 0 : ms));
  }

  function close() {
    setLeaving(true);
    later(() => {
      setOpen(false);
      setLeaving(false);
    }, 380);
  }

  function skip() {
    startTransition(async () => {
      await saveRoll(null, null);
    });
    close();
  }

  function chooseClass(cls: string) {
    if (picked) return;
    setPicked(cls);
    later(() => setStage("spec"), 650);
  }

  function back() {
    setStage("class");
    setPicked(null);
  }

  function chooseSpec(next: string) {
    if (!picked || spec) return;
    setSpec(next);
    setError(null);
    startTransition(async () => {
      const result = await saveRoll(picked, next);
      if (!result.ok) {
        setSpec(null);
        setError(result.error);
        return;
      }
      setStage("done");
      router.refresh();
      later(close, 1700);
    });
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const color = picked ? (classColor(picked) ?? "var(--gold)") : "var(--gold)";
  const firstName = name.split(/\s+/)[0];

  return (
    <div
      ref={dialog}
      className={`roll-gate ${leaving ? "is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="roll-title"
      tabIndex={-1}
      style={{ "--cc": color } as CSSProperties}
    >
      <div className="roll-inner">
        {stage === "class" ? (
          <section className="roll-stage" key="class">
            <header className="roll-head">
              <p className="roll-eyebrow">Welcome to 4Ever, {firstName}</p>
              <h2 id="roll-title" className="roll-title">
                Choose your class
              </h2>
              <p className="roll-sub">It goes on your profile next to your name. You can change it any time.</p>
            </header>
            <div className={`roll-classes ${picked ? "has-pick" : ""}`}>
              {CLASSES.map((cls, i) => (
                <button
                  key={cls}
                  type="button"
                  className={`roll-class ${picked === cls ? "is-picked" : ""}`}
                  style={{ "--cc": classColor(cls), "--i": i } as CSSProperties}
                  onClick={() => chooseClass(cls)}
                  aria-label={`${cls}: ${specsFor(cls).join(", ")}`}
                >
                  <span className="roll-emblem">
                    <img src={classIcon(cls)} alt="" width={64} height={64} />
                  </span>
                  <span className="roll-class-name">{cls}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {stage === "spec" && picked ? (
          <section className="roll-stage" key="spec">
            <header className="roll-head">
              <span className="roll-emblem roll-emblem-lg">
                <img src={classIcon(picked)} alt="" width={84} height={84} />
              </span>
              <p className="roll-eyebrow">{picked}</p>
              <h2 id="roll-title" className="roll-title">
                Choose your specialization
              </h2>
            </header>
            <div className="roll-specs">
              {specsFor(picked).map((s, i) => {
                const info = SPEC_INFO[picked]?.[s];
                return (
                  <button
                    key={s}
                    type="button"
                    className={`roll-spec ${spec === s ? "is-picked" : ""} ${spec && spec !== s ? "is-dim" : ""}`}
                    style={{ "--i": i } as CSSProperties}
                    onClick={() => chooseSpec(s)}
                    disabled={pending && spec !== s}
                  >
                    <span className="roll-spec-name">{s}</span>
                    {info ? <span className="roll-spec-role">{info.role}</span> : null}
                    {info ? <span className="roll-spec-line">&ldquo;{info.line}&rdquo;</span> : null}
                  </button>
                );
              })}
            </div>
            {error ? (
              <p className="roll-error" role="alert">
                {error}
              </p>
            ) : null}
          </section>
        ) : null}

        {stage === "done" && picked && spec ? (
          <section className="roll-stage roll-done" key="done" aria-live="polite">
            <span className="roll-emblem roll-emblem-lg">
              <img src={classIcon(picked)} alt="" width={84} height={84} />
            </span>
            <p className="roll-eyebrow">Locked in</p>
            <h2 id="roll-title" className="roll-title roll-title-class">
              {spec} {picked}
            </h2>
          </section>
        ) : null}

        {stage !== "done" ? (
          <div className="roll-foot">
            {stage === "spec" ? (
              <button type="button" className="roll-link" onClick={back} disabled={Boolean(spec)}>
                Back to classes
              </button>
            ) : null}
            <button type="button" className="roll-link" onClick={skip}>
              Not now
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
