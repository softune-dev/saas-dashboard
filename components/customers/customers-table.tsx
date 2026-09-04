"use client";

import { Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  TableFilterPanel,
  type TableFilterField,
} from "@/components/ui/table-filter-panel";
import { formatDisplayDate } from "@/lib/format";
import type { CustomerOut } from "@/lib/api/customers";

export type CustomerFilters = {
  /** "" = all, "email" = has email, "no-email" = phone only. */
  contact: "" | "email" | "no-email";
};

export const emptyCustomerFilters: CustomerFilters = {
  contact: "",
};

export function CustomersTable({
  customers,
  filters,
  onFiltersChange,
  onView,
  initialQuery = "",
}: {
  customers: CustomerOut[];
  filters: CustomerFilters;
  onFiltersChange: (next: CustomerFilters) => void;
  onView: (customer: CustomerOut) => void;
  /** Prefill from header search deep-link (?q=). */
  initialQuery?: string;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);

  const filterFields: TableFilterField[] = useMemo(
    () => [
      {
        key: "contact",
        label: t("Contact"),
        options: [
          { value: "", label: t("Any contact info") },
          { value: "email", label: t("Has email") },
          { value: "no-email", label: t("Phone Only") },
        ],
      },
    ],
    [t],
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((item) => {
      if (filters.contact === "email" && !item.email) return false;
      if (filters.contact === "no-email" && item.email) return false;
      if (!q) return true;
      return (
        (item.name ?? "").toLowerCase().includes(q) ||
        (item.email ?? "").toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, query, filters]);

  const columns: TableColumn<CustomerOut>[] = [
    {
      id: "details",
      header: t("Customer"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {row.name || "Unnamed"}
          </p>
          {row.email ? (
            <p className="truncate text-xs text-muted">{row.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "phone",
      header: t("Phone"),
      className: "whitespace-nowrap",
      cell: (row) => <span className="text-muted">{row.phone}</span>,
    },
    {
      id: "since",
      header: t("Customer Since"),
      className: "whitespace-nowrap",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.created_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("Actions"),
      headerClassName: "text-right",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <button
          type="button"
          aria-label={`View ${row.name || row.phone}`}
          onClick={() => onView(row)}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {t("All Customers")}
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
              placeholder={t("Search customers...")}
              className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
            />
          </div>
          <TableFilterPanel
            ariaLabel={t("Filter customers")}
            fields={filterFields}
            value={filters as unknown as Record<string, string>}
            empty={emptyCustomerFilters as unknown as Record<string, string>}
            onChange={(next) =>
              onFiltersChange({
                contact: (next.contact ?? "") as CustomerFilters["contact"],
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("No customers match your search or filters")}
      />
    </section>
  );
}
