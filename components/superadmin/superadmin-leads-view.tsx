"use client";

import { Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate } from "@/lib/format";
import {
  convertLead,
  useLeadsSWR,
  type ConvertLeadIn,
  type SuperAdminLead,
} from "@/lib/api/superadmin";
import { ConvertLeadModal } from "./convert-lead-modal";
import { LeadStatusBadge } from "./status-badge";

const STATUS_OPTIONS: { value: SuperAdminLead["status"] | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "signed_up", label: "Signed up" },
  { value: "otp_verified", label: "OTP verified" },
  { value: "profile_complete", label: "Profile complete" },
  { value: "demo_accessed", label: "Demo accessed" },
  { value: "purchase_requested", label: "Purchase requested" },
];

/** Anything past the first funnel step can be turned into a tenant. */
function canConvert(status: SuperAdminLead["status"]) {
  return status !== "signed_up";
}

export function SuperAdminLeadsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const { me, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  const allowed = me?.user.is_superadmin === true;

  const [query, setQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("");
  const [converting, setConverting] = useState<SuperAdminLead | null>(null);
  const [convertBusy, setConvertBusy] = useState(false);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const {
    data: page,
    error: listError,
    isLoading,
    mutate,
  } = useLeadsSWR({
    q: query.trim() || undefined,
    status_filter: statusFilter || undefined,
  });

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const leads = page?.items ?? [];
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : "Failed to load leads"
    : null;

  async function handleConvert(data: ConvertLeadIn) {
    if (!converting) return;
    setConvertBusy(true);
    try {
      const tenant = await convertLead(converting.id, data);
      await mutate();
      await globalMutate(
        (key) => Array.isArray(key) && key[0] === "superadmin-tenants",
      );
      await globalMutate(
        (key) => Array.isArray(key) && key[0] === "superadmin-stats",
      );
      setConverting(null);
      toast({
        title: "Converted to customer",
        description: `${tenant.name} is live on ${data.plan}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't convert lead",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setConvertBusy(false);
    }
  }

  const columns: TableColumn<SuperAdminLead>[] = [
    {
      id: "person",
      header: "Lead",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {row.full_name || row.email}
          </p>
          {row.full_name ? (
            <p className="truncate text-xs text-muted">{row.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "shop",
      header: "Shop",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{row.shop_name || "—"}</p>
          {row.shop_category ? (
            <p className="truncate text-xs text-muted">{row.shop_category}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <LeadStatusBadge status={row.status} />,
    },
    {
      id: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="text-muted">{row.phone || "—"}</span>
      ),
    },
    {
      id: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.created_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) =>
        canConvert(row.status) ? (
          <button
            type="button"
            onClick={() => setConverting(row)}
            className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Convert to customer
          </button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Leads" />

      {isLoading && leads.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : error ? (
        <EmptyState
          icon={UserPlus}
          title="Couldn't load leads"
          description={error}
        />
      ) : (
        <section className="rounded-md bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              All leads
              {page ? (
                <span className="ml-2 text-sm font-normal text-muted">
                  {page.total}
                </span>
              ) : null}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search leads..."
                  className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="h-9 rounded-full border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={leads}
            rowKey={(row) => row.id}
            emptyMessage="No leads match this search."
            pageSize={10}
          />
        </section>
      )}

      <ConvertLeadModal
        open={converting !== null}
        lead={converting}
        busy={convertBusy}
        onClose={() => setConverting(null)}
        onConvert={handleConvert}
      />
    </div>
  );
}
