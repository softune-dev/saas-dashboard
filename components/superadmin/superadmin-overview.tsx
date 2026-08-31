"use client";

import { LayoutDashboard } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { StatsGrid } from "@/components/dashboard/stats/stats-grid";
import type { StatCardData } from "@/components/dashboard/stats/stats-data";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { formatNumber } from "@/lib/format";
import { useSuperAdminStatsSWR } from "@/lib/api/superadmin";

const PLAN_LABELS: Record<string, string> = {
  demo: "Demo",
  starter: "Starter",
  growth: "Growth",
  business: "Business",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

function BreakdownCard({
  title,
  rows,
  labels,
}: {
  title: string;
  rows: Record<string, number> | undefined;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(rows ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border dark:divide-transparent">
          {entries.map(([key, count]) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted">
                {labels[key] ?? key}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatNumber(count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SuperAdminOverview() {
  const router = useRouter();
  const { me, loading: sessionLoading } = useSession();
  const allowed = me?.user.is_superadmin === true;
  const { data, error: swrError, isLoading } = useSuperAdminStatsSWR();

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "Failed to load overview"
    : null;

  const stats: StatCardData[] = data
    ? [
        {
          id: "tenants",
          title: "Total Tenants",
          value: formatNumber(data.total_tenants),
          icon: "/sidebar/customers.svg",
        },
        {
          id: "users",
          title: "Total Users",
          value: formatNumber(data.total_users),
          icon: "/sidebar/user.svg",
        },
        {
          id: "active",
          title: "Active Users",
          value: formatNumber(data.active_users),
          icon: "/sidebar/account.svg",
        },
        {
          id: "new",
          title: "New This Week",
          value: formatNumber(data.new_tenants_7d),
          icon: "/sidebar/analytics.svg",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Overview" />

      {isLoading && !data ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-md bg-surface" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Couldn't load overview"
          description={error}
        />
      ) : (
        <>
          <StatsGrid stats={stats} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <BreakdownCard
              title="Tenants by plan"
              rows={data?.tenants_by_plan}
              labels={PLAN_LABELS}
            />
            <BreakdownCard
              title="Tenants by status"
              rows={data?.tenants_by_status}
              labels={STATUS_LABELS}
            />
          </div>
        </>
      )}
    </div>
  );
}
