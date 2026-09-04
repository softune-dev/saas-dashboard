import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useLanguage } from "@/components/providers/language-provider";
import type { StatCardData } from "./stats-data";

type StatCardProps = {
  stat: StatCardData;
  /** Shrinks the card on mobile only (sm: and up render exactly as before)
   * — smaller icon, tighter padding, no "Last Month" line, meant to pair
   * with a 2-up grid instead of full-width stacked cards. Used everywhere
   * stats appear (Dashboard, Categories, Products, Orders, Analytics,
   * Customers) so tables get more room on small screens across the app. */
  compact?: boolean;
};

export function StatCard({ stat, compact = false }: StatCardProps) {
  const { t } = useLanguage();
  const hasTrend = stat.changePercent !== undefined;
  const isUp = (stat.changePercent ?? 0) >= 0;
  const changeAbs = Math.abs(stat.changePercent ?? 0).toFixed(1);

  return (
    <article
      className={[
        "relative flex flex-col justify-between rounded-md bg-surface",
        compact
          ? "min-h-[76px] p-3 pr-3 sm:min-h-[132px] sm:p-4 sm:pr-16"
          : "min-h-[132px] p-4 pr-4 sm:pr-16",
        stat.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute top-4 right-4 hidden size-11 items-center justify-center rounded-full bg-primary text-white sm:flex">
        <MaskIcon src={stat.icon} className="size-5" />
      </div>

      <p
        className={[
          "flex items-center gap-1.5 font-medium text-muted",
          compact ? "text-xs sm:text-sm" : "text-sm",
        ].join(" ")}
      >
        {/* The big top-right icon is desktop-only now (see above) — every
         * card, compact or not, gets this small one instead on mobile, so
         * Dashboard's own cards match Categories/Products/Orders/Analytics/
         * Customers instead of losing their icon on small screens. Neutral
         * gray, not brand color: dark gray in light mode, light gray in
         * dark mode (text-muted already flips that way — see globals.css). */}
        <MaskIcon src={stat.icon} className="size-3.5 shrink-0 text-muted sm:hidden" />
        {t(stat.title)}
      </p>

      <div
        className={[
          "flex flex-wrap items-center gap-2",
          compact ? "mt-1 sm:mt-2" : "mt-2",
        ].join(" ")}
      >
        <p
          className={[
            "font-semibold tracking-tight text-foreground",
            compact ? "text-lg sm:text-2xl" : "text-2xl",
          ].join(" ")}
        >
          {stat.value}
        </p>
        {hasTrend ? (
          <span
            className={[
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              isUp
                ? "bg-primary/10 text-primary"
                : "bg-rose-500/10 text-red-500",
              compact ? "hidden sm:inline-flex" : "",
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
        <p
          className={[
            "mt-3 text-xs text-muted",
            compact ? "hidden sm:block" : "",
          ].join(" ")}
        >
          {t("Last Month:")}{" "}
          <span
            className={
              stat.lastMonthValue === "No data"
                ? "font-medium text-muted-soft italic"
                : "font-medium text-foreground"
            }
          >
            {t(stat.lastMonthValue)}
          </span>
        </p>
      ) : (
        <div
          className={["mt-3 h-[17px]", compact ? "hidden sm:block" : ""].join(" ")}
          aria-hidden
        />
      )}
    </article>
  );
}
