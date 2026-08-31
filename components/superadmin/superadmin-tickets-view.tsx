"use client";

import { Eye, LifeBuoy, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/help-desk/ticket-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/format";
import {
  useTicketsSWR,
  type SuperAdminTicket,
} from "@/lib/api/superadmin";
import { TicketDetailModal } from "./ticket-detail-modal";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Replied", label: "Replied" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
];

export function SuperAdminTicketsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const { me, loading: sessionLoading } = useSession();
  const allowed = me?.user.is_superadmin === true;

  const [query, setQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<SuperAdminTicket | null>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const {
    data: page,
    error: listError,
    isLoading,
    mutate,
  } = useTicketsSWR({
    q: query.trim() || undefined,
    status_filter: statusFilter || undefined,
  });

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const tickets = page?.items ?? [];
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : "Failed to load tickets"
    : null;

  function handleUpdated(updated: SuperAdminTicket) {
    setSelected(updated);
    void mutate();
  }

  const columns: TableColumn<SuperAdminTicket>[] = [
    {
      id: "number",
      header: "Ticket",
      cell: (row) => (
        <span className="font-mono font-semibold text-foreground">
          {row.ticket_number_display}
        </span>
      ),
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.tenant_name}</p>
          <p className="truncate text-xs text-muted">{row.user_email}</p>
        </div>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-foreground">{row.subject}</p>
          <p className="truncate text-xs text-muted">{row.category}</p>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      cell: (row) => <TicketPriorityBadge priority={row.priority} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <TicketStatusBadge status={row.status} />,
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
      cell: (row) => (
        <button
          type="button"
          aria-label={`Open ${row.ticket_number_display}`}
          onClick={() => setSelected(row)}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Tickets" />

      {isLoading && tickets.length === 0 ? (
        <TableSkeleton columns={7} />
      ) : error ? (
        <EmptyState
          icon={LifeBuoy}
          title="Couldn't load tickets"
          description={error}
        />
      ) : (
        <section className="rounded-md bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              All tickets
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
                  placeholder="Search tickets..."
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
            data={tickets}
            rowKey={(row) => row.id}
            emptyMessage="No tickets match this search."
            pageSize={10}
          />
        </section>
      )}

      <TicketDetailModal
        ticket={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
