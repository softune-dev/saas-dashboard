"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  TableFilterPanel,
  type TableFilterField,
} from "@/components/ui/table-filter-panel";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { DerivedCustomer } from "./customers-data";

export type CustomerFilters = {
  /** "" = all, "repeat" = 2+ orders, "single" = exactly 1. */
  activity: "" | "repeat" | "single";
  /** "" = all, "email" | "phone" | "both". */
  contact: "" | "email" | "phone" | "both";
};

export const emptyCustomerFilters: CustomerFilters = {
  activity: "",
  contact: "",
};

const CUSTOMER_FILTER_FIELDS: TableFilterField[] = [
  {
    key: "activity",
    label: "Orders",
    options: [
      { value: "", label: "All customers" },
      { value: "repeat", label: "Repeat buyers (2+)" },
      { value: "single", label: "One-time (1 order)" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    options: [
      { value: "", label: "Any contact info" },
      { value: "email", label: "Has email" },
      { value: "phone", label: "Has phone" },
      { value: "both", label: "Email and phone" },
    ],
  },
];

export function CustomersTable({
  customers,
  filters,
  onFiltersChange,
  initialQuery = "",
}: {
  customers: DerivedCustomer[];
  filters: CustomerFilters;
  onFiltersChange: (next: CustomerFilters) => void;
  /** Prefill from header search deep-link (?q=). */
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  // Keep in sync if the URL q changes while this table is mounted.
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((item) => {
      if (filters.activity === "repeat" && item.orderCount < 2) return false;
      if (filters.activity === "single" && item.orderCount !== 1) return false;
      if (filters.contact === "email" && !item.email) return false;
      if (filters.contact === "phone" && !item.phone) return false;
      if (filters.contact === "both" && !(item.email && item.phone)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, query, filters]);

  const columns: TableColumn<DerivedCustomer>[] = [
    {
      id: "details",
      header: "Customer",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{row.name}</p>
          {row.email ? (
            <p className="truncate text-xs text-muted">{row.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="text-muted">{row.phone || "—"}</span>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          {row.orderCount}
        </span>
      ),
    },
    {
      id: "spent",
      header: "Total Spent",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatTaka(row.spentCents / 100)}
        </span>
      ),
    },
    {
      id: "first",
      header: "First Order",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.firstOrderAt))}
        </span>
      ),
    },
    {
      id: "last",
      header: "Last Order",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.lastOrderAt))}
        </span>
      ),
    },
  ];

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          All Customers
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
              placeholder="Search customers..."
              className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
            />
          </div>
          <TableFilterPanel
            ariaLabel="Filter customers"
            fields={CUSTOMER_FILTER_FIELDS}
            value={filters as unknown as Record<string, string>}
            empty={emptyCustomerFilters as unknown as Record<string, string>}
            onChange={(next) =>
              onFiltersChange({
                activity: (next.activity ?? "") as CustomerFilters["activity"],
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
        emptyMessage="No customers match your search or filters"
      />
    </section>
  );
}
