import { setPlayerMade } from "@/app/actions/clip";

// The gold "Player-made" mark: a video someone actually created and edited, not a raw stream clip.
export function PlayerMadeMark({ className = "" }: { className?: string }) {
  return (
    <span className={`player-made ${className}`} title="Made and edited by a player">
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
      </svg>
      Player-made
    </span>
  );
}

// Curators can add or remove the mark from a video's page.
export function PlayerMadeToggle({ clipId, shortId, on }: { clipId: string; shortId: string; on: boolean }) {
  return (
    <form action={setPlayerMade} className="inline-form">
      <input type="hidden" name="clipId" value={clipId} />
      <input type="hidden" name="shortId" value={shortId} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button type="submit" className="link-button">
        {on ? "Remove Player-made mark" : "Mark as Player-made"}
      </button>
    </form>
  );
}
