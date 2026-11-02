// Clips this browser has already watched (in the swipe feed, or played on a card or a video's page).
// Kept in localStorage, so it belongs to one browser; nothing about it is sent anywhere.
const SEEN_KEY = "4ever:seen-clips";
const SEEN_EVENT = "4ever:seen";

export function readSeenRaw(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function readSeen(): string[] {
  try {
    const value = JSON.parse(readSeenRaw());
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function markSeen(id: string) {
  try {
    const seen = readSeen().filter((v) => v !== id);
    seen.push(id);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-3000)));
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    // Private browsing or storage turned off: everything still works, it just can't remember.
  }
}

export function clearSeen() {
  try {
    window.localStorage.removeItem(SEEN_KEY);
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    // Nothing to clear.
  }
}

// For useSyncExternalStore: changes in this tab (the event) and in other tabs (storage).
export function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
