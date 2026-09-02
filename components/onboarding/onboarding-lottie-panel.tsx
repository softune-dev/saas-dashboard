"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/** Per-step art (public/*.lottie). Most files are framed fine at their
 * native size — `zoom` is an opt-in per instance, not a global scale, for
 * the few whose source art sits small/off-center in its own canvas. */
export function OnboardingLottiePanel({ src, zoom }: { src: string; zoom?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden p-6" aria-hidden>
      <DotLottieReact
        src={src}
        loop
        autoplay
        layout={{ fit: "contain", align: [0.5, 0.5] }}
        className="size-full"
        style={zoom ? { transform: `scale(${zoom})` } : undefined}
      />
    </div>
  );
}
