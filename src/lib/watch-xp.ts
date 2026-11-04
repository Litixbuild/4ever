"use client";

// Counts watch time in the browser and turns each full minute into XP (POST /api/xp).
// Time only counts while a video is playing (setWatching) and the tab is visible. Each video gets a
// budget of seconds (about its own length), so a paused or forgotten embed stops earning by itself.
// Seconds carry over between videos, so three 20-second clips still make a minute.

import type { Faction } from "@/lib/ranks";
import type { XpResponse } from "@/app/api/xp/route";

export const XP_EVENT = "4ever:xp";
export type XpEventDetail = XpResponse;

type State = { xp: number; faction: Faction | null; loggedIn: boolean };

let state: State = { xp: 0, faction: null, loggedIn: false };
const listeners = new Set<() => void>();

let watching = false;
let budget = 0;
let seconds = 0;
let timer: number | null = null;
let sending = false;

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeXp(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getXpState(): State {
  return state;
}

const serverState: State = { xp: 0, faction: null, loggedIn: false };
export function getServerXpState(): State {
  return serverState;
}

// Called once by <XpInit> with the logged-in person's saved XP.
export function initXp(next: State) {
  if (next.loggedIn === state.loggedIn && next.xp <= state.xp && next.faction === state.faction) return;
  state = { ...next, xp: Math.max(next.xp, state.loggedIn ? state.xp : 0) };
  emit();
}

async function sendMinute() {
  if (sending) return;
  sending = true;
  try {
    const res = await fetch("/api/xp", { method: "POST", keepalive: true });
    if (res.status === 401) {
      state = { ...state, loggedIn: false };
      emit();
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as XpResponse;
    state = { ...state, xp: data.xp };
    emit();
    window.dispatchEvent(new CustomEvent<XpEventDetail>(XP_EVENT, { detail: data }));
  } catch {
    // Offline or blocked: this minute is lost, the next one tries again.
  } finally {
    sending = false;
  }
}

function tick() {
  if (!watching || budget <= 0 || document.visibilityState !== "visible") return;
  budget -= 1;
  seconds += 1;
  if (seconds >= 60) {
    seconds -= 60;
    if (state.loggedIn) void sendMinute();
  }
}

// Start (or stop) counting. budgetSeconds is how long this video can earn without being restarted.
export function setWatching(on: boolean, budgetSeconds = 15 * 60) {
  if (typeof window === "undefined") return;
  watching = on;
  if (on) budget = Math.max(30, Math.round(budgetSeconds));
  if (on && timer === null) timer = window.setInterval(tick, 1000);
  if (!on && timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

// A budget a little longer than the video itself, so a full watch always counts.
export function budgetFor(durationSeconds: number | null | undefined): number {
  const d = Number(durationSeconds) || 0;
  return d > 0 ? d * 1.2 + 20 : 15 * 60;
}
