export type StatCardData = {
  id: string;
  title: string;
  value: string;
  /** Omitted only when there's no baseline to compute a percent against
   * (lastMonth was 0) — see lib/trends.ts's monthOverMonth. */
  changePercent?: number;
  /** Omit only when this metric has no time axis at all (e.g. Active/
   * Inactive counts, Inventory Value — no history is tracked for them).
   * When the metric DOES have a time axis but there's genuinely no data
   * from last month, this is the literal string "No data" rather than
   * omitted — StatCard always shows the line, never a blank placeholder,
   * for any card that could in principle have a trend. */
  lastMonthValue?: string;
  icon: string;
  className?: string;
};
