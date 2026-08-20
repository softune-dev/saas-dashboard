"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { TourStep } from "./tour-steps";

type TourOverlayProps = {
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;

function readRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function TourOverlay({
  step,
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  onBack,
  onNext,
  onSkip,
}: TourOverlayProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const update = () => setRect(readRect(step.selector));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.selector]);

  // Keep the target scrolled into view when possible.
  useEffect(() => {
    const el = document.querySelector(step.selector);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [step.selector]);

  const hole = useMemo(() => {
    if (!rect) return null;
    return {
      top: Math.max(8, rect.top - PAD),
      left: Math.max(8, rect.left - PAD),
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    };
  }, [rect]);

  const tooltip = useMemo(() => {
    const tipW = 320;
    const tipH = 200;
    const gap = 14;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    if (!hole) {
      return {
        top: Math.max(24, (vh - tipH) / 2),
        left: Math.max(24, (vw - tipW) / 2),
        placement: "bottom" as const,
      };
    }

    const placement = step.placement ?? "right";
    let top = hole.top;
    let left = hole.left + hole.width + gap;

    if (placement === "right") {
      left = hole.left + hole.width + gap;
      top = hole.top + hole.height / 2 - tipH / 2;
      if (left + tipW > vw - 16) {
        left = Math.max(16, hole.left - tipW - gap);
      }
    } else if (placement === "left") {
      left = hole.left - tipW - gap;
      top = hole.top + hole.height / 2 - tipH / 2;
      if (left < 16) left = hole.left + hole.width + gap;
    } else if (placement === "bottom") {
      top = hole.top + hole.height + gap;
      left = hole.left + hole.width / 2 - tipW / 2;
      if (top + tipH > vh - 16) top = Math.max(16, hole.top - tipH - gap);
    } else {
      top = hole.top - tipH - gap;
      left = hole.left + hole.width / 2 - tipW / 2;
      if (top < 16) top = hole.top + hole.height + gap;
    }

    return {
      top: Math.min(Math.max(16, top), vh - tipH - 16),
      left: Math.min(Math.max(16, left), vw - tipW - 16),
      placement,
    };
  }, [hole, step.placement]);

  return (
    <div className="fixed inset-0 z-[220]" role="dialog" aria-modal="true" aria-label="Dashboard tour">
      {/* Dim overlay with spotlight cutout via huge box-shadow */}
      {hole ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary/80 transition-[top,left,width,height] duration-200"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/45" />
      )}

      {/* Click-catcher outside the tip (doesn't block tip buttons) */}
      <div className="absolute inset-0" aria-hidden />

      <div
        className="absolute z-[221] w-[min(100vw-2rem,20rem)] rounded-2xl border border-border bg-surface p-4 shadow-xl"
        style={{ top: tooltip.top, left: tooltip.left }}
      >
        <p className="text-[11px] font-semibold tracking-wide text-muted-soft uppercase">
          Step {stepIndex + 1} of {stepCount}
        </p>
        <h3 className="mt-1 text-[15px] font-semibold text-foreground">
          {step.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="mr-auto text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
          {!isFirst ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center justify-center rounded-full bg-search-bg px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-border"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
