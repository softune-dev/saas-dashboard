"use client";

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { MaskIcon } from "@/components/ui/mask-icon";
import { tickets, type HelpTicket } from "./help-data";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./ticket-status-badge";

const columns: TableColumn<HelpTicket>[] = [
  {
    id: "ticketId",
    header: "Ticket",
    cell: (row) => (
      <span className="font-semibold text-foreground">{row.ticketId}</span>
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
    cell: (row) => <span className="text-muted">{row.updatedAt}</span>,
  },
  {
    id: "actions",
    header: "View",
    headerClassName: "text-right",
    className: "text-right",
    cell: (row) => (
      <button
        type="button"
        aria-label={`View ${row.ticketId}`}
        className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
      >
        <Eye className="size-3.5" strokeWidth={1.75} />
      </button>
    ),
  },
];

export function TicketsTable() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.ticketId.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q),
    );
  }, [query]);

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

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        pageSize={5}
        emptyMessage="No tickets match your search"
      />
    </section>
  );
}
