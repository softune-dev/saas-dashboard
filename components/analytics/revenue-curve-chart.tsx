"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { RevenueCurvePoint } from "@/lib/api/analytics";

/** Plot-only viewBox — Y labels live outside so the curve can fill width. */
const W = 1000;
const H = 200;
const PAD = { top: 20, right: 6, bottom: 4, left: 6 };

/** Always keep first/last; fill remaining slots evenly so labels don't collide. */
function pickLabelIndexes(count: number, maxLabels: number): Set<number> {
  if (count <= 0) return new Set();
  if (count <= maxLabels) {
    return new Set(Array.from({ length: count }, (_, i) => i));
  }
  const max = Math.max(2, maxLabels);
  const picked = new Set<number>([0, count - 1]);
  const inner = max - 2;
  for (let s = 1; s <= inner; s++) {
    const i = Math.round((s * (count - 1)) / (inner + 1));
    picked.add(i);
  }
  return picked;
}

export function RevenueCurveChart({ curve }: { curve: RevenueCurvePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotW, setPlotW] = useState(0);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setPlotW(w);
    });
    ro.observe(el);
    setPlotW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const { path, area, points, yTicks } = useMemo(() => {
    const revenues = curve.map((p) => p.revenue_cents / 100);
    const max = Math.max(1, ...revenues) * 1.08;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const pts = curve.map((p, i) => {
      const x =
        PAD.left +
        (curve.length === 1 ? innerW / 2 : (i / (curve.length - 1)) * innerW);
      const revenue = p.revenue_cents / 100;
      const y = PAD.top + innerH - (revenue / max) * innerH;
      return { x, y, label: p.label, revenue, orders: p.orders };
    });

    const line = pts
      .map((pt, i) =>
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
      )
      .join(" ");

    const baseY = PAD.top + innerH;
    const areaPath =
      pts.length === 0
        ? ""
        : `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`;

    const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => ({
      value: Math.round(max * t),
      y: PAD.top + innerH * (1 - t),
    }));

    return { path: line, area: areaPath, points: pts, yTicks: ticks };
  }, [curve]);

  // ~56px per label; always show at least endpoints when there's data.
  const maxLabels = Math.max(2, Math.floor(plotW / 56));
  const visible = useMemo(
    () => pickLabelIndexes(curve.length, maxLabels),
    [curve.length, maxLabels],
  );

  return (
    <div className="flex w-full min-w-0 gap-2">
      {/* Y axis — outside plot so chart can use full width */}
      <div className="flex w-8 shrink-0 flex-col justify-between pb-7 text-right">
        {yTicks.map((tick) => (
          <span
            key={`${tick.value}-${tick.y}`}
            className="text-[10px] leading-none font-medium text-muted-soft"
          >
            {tick.value >= 1000
              ? `${Math.round(tick.value / 1000)}k`
              : tick.value}
          </span>
        ))}
      </div>

      {/* Plot fills remaining container width edge-to-edge */}
      <div ref={plotRef} className="flex min-w-0 flex-1 flex-col">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[200px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Revenue curve chart"
        >
          {yTicks.map((tick) => (
            <line
              key={`${tick.value}-${tick.y}`}
              x1={0}
              x2={W}
              y1={tick.y}
              y2={tick.y}
              className="stroke-border dark:stroke-border/50"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {area ? <path d={area} fill="#FF5A36" fillOpacity="0.12" /> : null}

          {path ? (
            <path
              d={path}
              fill="none"
              stroke="#FF5A36"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {points.map((pt, i) => {
            const active = hovered === i;
            return (
              <g
                key={`${pt.label}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={active ? 6 : 4}
                  fill="#FF5A36"
                  stroke="#fff"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
                {active ? (
                  <g>
                    <rect
                      x={pt.x - 48}
                      y={pt.y - 40}
                      width="96"
                      height="28"
                      rx="6"
                      fill="#FF5A36"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 21}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {formatNumber(pt.revenue)}৳
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* X labels — positioned under points; thinned by available width */}
        <div className="relative mt-1 h-6 w-full overflow-hidden">
          {points.map((pt, i) => {
            if (!visible.has(i)) return null;
            const leftPct = (pt.x / W) * 100;
            const isFirst = i === 0;
            const isLast = i === points.length - 1;
            return (
              <span
                key={`${pt.label}-${i}`}
                title={pt.label}
                className={[
                  "absolute top-0 max-w-[4.75rem] truncate text-[10px] font-medium text-muted",
                  isFirst
                    ? "text-left"
                    : isLast
                      ? "text-right"
                      : "text-center",
                ].join(" ")}
                style={{
                  left: `${leftPct}%`,
                  transform: isFirst
                    ? "translateX(0)"
                    : isLast
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
                }}
              >
                {pt.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
