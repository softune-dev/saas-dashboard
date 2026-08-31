"use client";

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useHelpTicketsSWR, type HelpTicketOut } from "@/lib/api/help-desk";
import { formatDisplayDate } from "@/lib/format";
import { TicketDetailModal } from "./ticket-detail-modal";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./ticket-status-badge";

function buildColumns(onView: (row: HelpTicketOut) => void): TableColumn<HelpTicketOut>[] {
  return [
    {
      id: "ticketId",
      header: "Ticket",
      cell: (row) => (
        <span className="font-semibold text-foreground">
          {row.ticket_number_display}
        </span>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.subject}</p>
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
      id: "updatedAt",
      header: "Updated",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.updated_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "View",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <button
          type="button"
          onClick={() => onView(row)}
          aria-label={`View ${row.ticket_number_display}`}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
        </button>
      ),
    },
  ];
}

export function TicketsTable() {
  const { data, isLoading } = useHelpTicketsSWR();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HelpTicketOut | null>(null);

  const tickets = data?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.ticket_number_display.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q),
    );
  }, [query, tickets]);

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Your tickets
        </h2>

        <div className="flex items-center gap-2">
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
          <button
            type="button"
            aria-label="Filter tickets"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-slate-300"
          >
            <MaskIcon src="/sidebar/filter.svg" className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : (
        <DataTable
          columns={buildColumns(setSelected)}
          data={filtered}
          rowKey={(row) => row.id}
          pageSize={5}
          emptyMessage="No tickets yet — submit one above and it'll show up here."
        />
      )}

      <TicketDetailModal ticket={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
