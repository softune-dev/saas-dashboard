"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { RevenueCurvePoint } from "@/lib/api/analytics";

/** Plot-only viewBox — Y labels live outside so the curve can fill width. */
const W = 1000;
const H = 200;
const PAD = { top: 20, right: 6, bottom: 4, left: 6 };

export function RevenueCurveChart({ curve }: { curve: RevenueCurvePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { path, area, points, maxY, yTicks } = useMemo(() => {
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
    const areaPath = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`;

    const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => ({
      value: Math.round(max * t),
      y: PAD.top + innerH * (1 - t),
    }));

    return { path: line, area: areaPath, points: pts, maxY: max, yTicks: ticks };
  }, [curve]);

  return (
    <div className="flex w-full gap-2">
      {/* Y axis — outside plot so chart can use full width */}
      <div className="flex w-8 shrink-0 flex-col justify-between pb-6 text-right">
        {yTicks.map((tick) => (
          <span
            key={tick.value}
            className="text-[10px] leading-none font-medium text-muted-soft"
          >
            {tick.value >= 1000
              ? `${Math.round(tick.value / 1000)}k`
              : tick.value}
          </span>
        ))}
      </div>

      {/* Plot fills remaining container width edge-to-edge */}
      <div className="flex min-w-0 flex-1 flex-col">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[200px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Revenue curve chart"
        >
          {/* Full-width grid */}
          {yTicks.map((tick) => (
            <line
              key={tick.value}
              x1={0}
              x2={W}
              y1={tick.y}
              y2={tick.y}
              className="stroke-border dark:stroke-border/50"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill="#FF5A36" fillOpacity="0.12" />

          <path
            d={path}
            fill="none"
            stroke="#FF5A36"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {points.map((pt, i) => {
            const active = hovered === i;
            return (
              <g
                key={pt.label}
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
                {active && (
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
                )}
              </g>
            );
          })}
        </svg>

        {/* X labels aligned under full-width plot */}
        <div className="mt-1 flex justify-between px-0.5">
          {curve.map((p) => (
            <span
              key={p.label}
              className="text-[10px] font-medium text-muted"
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
