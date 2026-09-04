import { useLanguage } from "@/components/providers/language-provider";
import type { CategoryShare } from "@/lib/api/analytics";

const SIZE = 168;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Cycled by index — the backend reports real category names, not fixed
// palette-mapped ids, so colors are assigned positionally here instead.
const PALETTE = ["#FF5A36", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#64748B"];

export function CategoryPieChart({ shares }: { shares: CategoryShare[] }) {
  const { t } = useLanguage();
  let offset = 0;
  const segments = shares.map((item, i) => {
    const portion = item.percent / 100;
    const length = portion * CIRCUMFERENCE;
    const segment = {
      ...item,
      color: PALETTE[i % PALETTE.length],
      dasharray: `${length} ${CIRCUMFERENCE - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return segment;
  });

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#F4F4F5"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => (
            <circle
              key={seg.name}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-semibold text-foreground">
            {shares.length > 0 ? "100%" : "—"}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {shares.length === 0 ? (
          <li className="text-sm text-muted">{t("No sales in this period yet.")}</li>
        ) : null}
        {segments.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium text-foreground">
                {item.name}
              </span>
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-foreground">
              {item.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
