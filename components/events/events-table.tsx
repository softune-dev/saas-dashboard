"use client";

import { ImageOff, Pencil, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { TableFilterPanel, type TableFilterField } from "@/components/ui/table-filter-panel";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { EventOut } from "@/lib/api/commerce";

export type EventFilters = {
  status: "" | "active" | "inactive";
};

export const emptyEventFilters: EventFilters = { status: "" };

function EventStatusBadge({ active }: { active: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-primary/10 text-primary" : "bg-search-bg text-muted",
      ].join(" ")}
    >
      {active ? t("Active") : t("Inactive")}
    </span>
  );
}

export function EventsTable({
  events,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: {
  events: EventOut[];
  filters: EventFilters;
  onFiltersChange: (next: EventFilters) => void;
  onEdit: (event: EventOut) => void;
  onDelete: (event: EventOut) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const filterFields: TableFilterField[] = useMemo(
    () => [
      {
        key: "status",
        label: t("Status"),
        options: [
          { value: "", label: t("All statuses") },
          { value: "active", label: t("Active") },
          { value: "inactive", label: t("Inactive") },
        ],
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((item) => {
      if (filters.status === "active" && !item.is_active) return false;
      if (filters.status === "inactive" && item.is_active) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    });
  }, [events, query, filters]);

  const columns: TableColumn<EventOut>[] = [
    {
      id: "name",
      header: t("Event"),
      cell: (row) => (
        <div className="flex items-center gap-3.5 py-0.5">
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg sm:size-[4.5rem]">
            {row.image_url ? (
              <Image src={row.image_url} alt={row.name} fill sizes="72px" className="object-cover" />
            ) : (
              <ImageOff className="size-5 text-muted-soft" strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{row.name}</p>
            <p className="truncate text-xs text-muted">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: "discount",
      header: t("Discount"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.discount_percent}% {t("off")}</span>
      ),
    },
    {
      id: "products",
      header: t("Products"),
      className: "whitespace-nowrap",
      cell: (row) => <span className="font-medium text-foreground">{row.product_count}</span>,
    },
    {
      id: "status",
      header: t("Status"),
      className: "whitespace-nowrap",
      cell: (row) => <EventStatusBadge active={row.is_active} />,
    },
    {
      id: "actions",
      header: t("Actions"),
      headerClassName: "text-right",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => onEdit(row)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            onClick={() => onDelete(row)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-red-500"
          >
            <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{t("All Events")}</h2>

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
              placeholder={t("Search events...")}
              className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
            />
          </div>
          <TableFilterPanel
            ariaLabel={t("Filter events")}
            fields={filterFields}
            value={filters as unknown as Record<string, string>}
            empty={emptyEventFilters as unknown as Record<string, string>}
            onChange={(next) =>
              onFiltersChange({ status: (next.status ?? "") as EventFilters["status"] })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("No events match your search or filters")}
      />
    </section>
  );
}
