import type { SuperAdminTenant } from "@/lib/api/superadmin";

const tenantStyles: Record<SuperAdminTenant["status"], string> = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-rose-500/10 text-rose-500",
};

const tenantLabels: Record<SuperAdminTenant["status"], string> = {
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

/** Same pill language as OrderStatusBadge — tenant lifecycle, not orders. */
export function TenantStatusBadge({
  status,
}: {
  status: SuperAdminTenant["status"];
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tenantStyles[status] ?? "bg-search-bg text-muted",
      ].join(" ")}
    >
      {tenantLabels[status] ?? status}
    </span>
  );
}

export function UserActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-500",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
