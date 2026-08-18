/**
 * Two-tone notification chime, synthesized via the Web Audio API — no audio
 * file to source, license, or ship; a couple of oscillator nodes instead of
 * an mp3.
 *
 * Browsers block audio playback until the page has seen a user gesture, so
 * this module resumes a shared AudioContext on the first click/keypress
 * anywhere on the page. Until that happens, playNotificationSound() no-ops
 * silently — the bell's badge and animated dot still work regardless, sound
 * is a bonus once the tab has been interacted with.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    getContext()?.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export function playNotificationSound() {
  const audioCtx = getContext();
  if (!audioCtx || audioCtx.state === "suspended") return;

  const now = audioCtx.currentTime;
  const notes: [freq: number, start: number][] = [
    [880, now], // A5
    [1318.51, now + 0.09], // E6
  ];

  for (const [freq, start] of notes) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  }
}
