"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

/** Rounds a max value up to a "nice" number for axis ticks — e.g. 18,430 →
 * 20,000 — so labels read as round figures instead of awkward exact peaks. */
function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function shortTaka(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k৳`;
  return `${formatNumber(amount)}৳`;
}

type SalesChartProps = {
  /** Real per-month revenue in major currency units (Taka), oldest first. */
  bars: { label: string; amount: number }[];
};

export function SalesChart({ bars }: SalesChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxAmount = niceMax(Math.max(...bars.map((b) => b.amount), 0));
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => shortTaka(Math.round(maxAmount * f)));
  const yLabelsTopToBottom = [...yAxisLabels].reverse();
  const lastY = yLabelsTopToBottom.length - 1;

  return (
    <div className="flex h-[200px] gap-3">
      {/* Y axis — labels stay fully inside (top/bottom flush, no overflow) */}
      <div className="flex w-12 shrink-0 flex-col">
        <div className="relative min-h-0 flex-1">
          {yLabelsTopToBottom.map((label, index) => {
            const isFirst = index === 0;
            const isLast = index === lastY;

            return (
              <span
                key={label + index}
                className={[
                  "absolute right-0 text-[11px] leading-none font-medium text-muted-soft",
                  isFirst ? "top-0" : "",
                  isLast ? "bottom-0" : "",
                  !isFirst && !isLast ? "-translate-y-1/2" : "",
                ].join(" ")}
                style={
                  !isFirst && !isLast
                    ? { top: `${(index / lastY) * 100}%` }
                    : undefined
                }
              >
                {label}
              </span>
            );
          })}
        </div>
        {/* Same footprint as: gap-3 + X-label row (h-5) */}
        <div className="mt-3 h-5 shrink-0" aria-hidden />
      </div>

      {/* Plot + X labels */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="relative min-h-0 flex-1 overflow-visible">
          {/* Grid lines — first/last inset slightly so bars rest above bottom edge cleanly */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {yAxisLabels.map((label, i) => (
              <div
                key={label + i}
                className="w-full border-t border-dashed border-slate-200"
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full items-end justify-between gap-1 px-1 sm:gap-1.5">
            {bars.map((bar, index) => {
              const heightPct = Math.max((bar.amount / maxAmount) * 100, 4);
              const isActive = hovered === index;

              return (
                <div
                  key={bar.label + index}
                  className="flex h-full min-w-0 flex-1 items-end justify-center"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="relative w-full max-w-[10px] cursor-pointer sm:max-w-[12px]"
                    style={{ height: `${heightPct}%` }}
                  >
                    {isActive && (
                      <div className="absolute bottom-[calc(100%+0.65rem)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                        {formatNumber(bar.amount)}৳
                      </div>
                    )}

                    {isActive && (
                      <span className="absolute top-0 left-1/2 z-20 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary" />
                    )}

                    <div
                      className="h-full w-full rounded-sm bg-primary transition-opacity duration-200"
                      style={{
                        opacity: hovered === null || isActive ? 1 : 0.45,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex h-5 shrink-0 items-center justify-between gap-1 px-1 sm:gap-1.5">
          {bars.map((bar, i) => (
            <div
              key={bar.label + i}
              className="min-w-0 flex-1 text-center text-[10px] leading-none font-medium text-muted"
            >
              {bar.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
