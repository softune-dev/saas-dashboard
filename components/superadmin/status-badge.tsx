import type { SuperAdminLead, SuperAdminTenant } from "@/lib/api/superadmin";

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

const leadStyles: Record<SuperAdminLead["status"], string> = {
  signed_up: "bg-search-bg text-muted",
  otp_verified: "bg-blue-500/10 text-blue-600",
  profile_complete: "bg-blue-500/10 text-blue-600",
  demo_accessed: "bg-amber-500/10 text-amber-600",
  purchase_requested: "bg-emerald-500/10 text-emerald-600",
};

const leadLabels: Record<SuperAdminLead["status"], string> = {
  signed_up: "Signed up",
  otp_verified: "OTP verified",
  profile_complete: "Profile complete",
  demo_accessed: "Demo accessed",
  purchase_requested: "Purchase requested",
};

/** Further along the funnel reads as more qualified — muted → blue → orange → green. */
export function LeadStatusBadge({ status }: { status: SuperAdminLead["status"] }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        leadStyles[status] ?? "bg-search-bg text-muted",
      ].join(" ")}
    >
      {leadLabels[status] ?? status}
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
