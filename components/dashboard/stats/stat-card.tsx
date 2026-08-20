import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { StatCardData } from "./stats-data";

type StatCardProps = {
  stat: StatCardData;
};

export function StatCard({ stat }: StatCardProps) {
  const hasTrend = stat.changePercent !== undefined;
  const isUp = (stat.changePercent ?? 0) >= 0;
  const changeAbs = Math.abs(stat.changePercent ?? 0).toFixed(1);

  return (
    <article
      className={[
        "relative flex min-h-[132px] flex-col justify-between rounded-md bg-surface p-4 pr-16",
        stat.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-primary text-white">
        <MaskIcon src={stat.icon} className="size-5" />
      </div>

      <p className="text-sm font-medium text-muted">{stat.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {stat.value}
        </p>
        {hasTrend ? (
          <span
            className={[
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              isUp
                ? "bg-primary/10 text-primary"
                : "bg-rose-500/10 text-red-500",
            ].join(" ")}
          >
            {isUp ? (
              <ArrowUpRight className="size-3.5" strokeWidth={2} />
            ) : (
              <ArrowDownRight className="size-3.5" strokeWidth={2} />
            )}
            {changeAbs}%
          </span>
        ) : null}
      </div>

      {stat.lastMonthValue !== undefined ? (
        <p className="mt-3 text-xs text-muted">
          Last Month:{" "}
          <span
            className={
              stat.lastMonthValue === "No data"
                ? "font-medium text-muted-soft italic"
                : "font-medium text-foreground"
            }
          >
            {stat.lastMonthValue}
          </span>
        </p>
      ) : (
        <div className="mt-3 h-[17px]" aria-hidden />
      )}
    </article>
  );
}
