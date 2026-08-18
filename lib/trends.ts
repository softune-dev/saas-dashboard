/**
 * Month-over-month helpers for dashboard stat cards.
 *
 * Stock metrics (categories, products): "Last Month" = count as of the end of
 * last month (created_at < start of this calendar month).
 *
 * Flow metrics (orders, revenue): compare this calendar month so far vs all of
 * last calendar month — not cumulative-to-date.
 */

/** First instant of the calendar month containing `d` (local time). */
export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** First instant of the calendar month before the one containing `d`. */
export function startOfLastMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

/**
 * ((current - lastMonth) / lastMonth) * 100. `lastMonthValue` is always
 * returned when this card HAS a time axis (see monthOverMonth's callers) —
 * "no data" is itself real information (this store didn't exist yet, or had
 * nothing yet last month) and reads better than a silently blank line.
 * `changePercent` is only omitted when lastMonth is 0, since a percent
 * change against zero is undefined, not "0%" or "∞%".
 */
export function monthOverMonth(
  current: number,
  lastMonth: number,
  formatLastMonth: (n: number) => string = String,
): { changePercent?: number; lastMonthValue: string } {
  if (lastMonth === 0) return { lastMonthValue: "No data" };
  return {
    changePercent: ((current - lastMonth) / lastMonth) * 100,
    lastMonthValue: formatLastMonth(lastMonth),
  };
}

/** Stock baseline: records that already existed before this month began. */
export function countAsOfEndOfLastMonth(
  items: { created_at: string }[],
  now = new Date(),
): number {
  const cutoff = startOfMonth(now).getTime();
  return items.filter((item) => new Date(item.created_at).getTime() < cutoff)
    .length;
}

export type CalendarMonthBuckets<T> = {
  thisMonth: T[];
  lastMonth: T[];
};

/** Split records into this calendar month vs last calendar month. */
export function bucketByCalendarMonth<T extends { created_at: string }>(
  items: T[],
  now = new Date(),
): CalendarMonthBuckets<T> {
  const thisStart = startOfMonth(now).getTime();
  const lastStart = startOfLastMonth(now).getTime();
  const thisMonth: T[] = [];
  const lastMonth: T[] = [];
  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (t >= thisStart) thisMonth.push(item);
    else if (t >= lastStart && t < thisStart) lastMonth.push(item);
  }
  return { thisMonth, lastMonth };
}

export type MonthRevenueBucket = { label: string; amountCents: number };

/** Real revenue per calendar month for the last `months` months (oldest
 * first, ending with the current month) — feeds the dashboard's Sales
 * Analysis chart. Replaces what used to be a hardcoded placeholder series;
 * a month with no orders is a real, honest zero, not omitted or faked. */
export function bucketRevenueByMonth<
  T extends { created_at: string; total_cents: number },
>(orders: T[], months = 6, now = new Date()): MonthRevenueBucket[] {
  const buckets: MonthRevenueBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const start = monthStart.getTime();
    const end = nextStart.getTime();
    const amountCents = orders
      .filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= start && t < end;
      })
      .reduce((sum, o) => sum + o.total_cents, 0);
    buckets.push({
      label: monthStart.toLocaleDateString("en-US", { month: "short" }),
      amountCents,
    });
  }
  return buckets;
}
