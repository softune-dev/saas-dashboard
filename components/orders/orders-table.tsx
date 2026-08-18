"use client";

import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type TableColumn } from "@/components/ui/table";
import {
  TableFilterPanel,
  type TableFilterField,
} from "@/components/ui/table-filter-panel";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import {
  customerEmail,
  customerName,
} from "@/lib/order-customer";
import type { OrderOut, OrderStatus } from "@/lib/api/commerce";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "./order-status-badge";

export type OrderFilters = {
  status: OrderStatus | "";
};

export const emptyOrderFilters: OrderFilters = { status: "" };

const ORDER_FILTER_FIELDS: TableFilterField[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "", label: "All statuses" },
      ...ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    ],
  },
];

export function OrdersTable({
  orders,
  filters,
  onFiltersChange,
  onView,
}: {
  orders: OrderOut[];
  filters: OrderFilters;
  onFiltersChange: (next: OrderFilters) => void;
  onView: (order: OrderOut) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((item) => {
      const name = customerName(item.customer).toLowerCase();
      const email = customerEmail(item.customer).toLowerCase();
      return (
        item.order_number.toLowerCase().includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [orders, query]);

  const columns: TableColumn<OrderOut>[] = [
    {
      id: "orderId",
      header: "Order ID",
      cell: (row) => (
        <span className="font-semibold text-foreground">{row.order_number}</span>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.created_at))}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (row) => {
        const name = customerName(row.customer);
        const email = customerEmail(row.customer);
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{name}</p>
            {email ? (
              <p className="truncate text-xs text-muted">{email}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: (row) => (
        <span className="font-medium tabular-nums">
          {row.items.reduce((n, i) => n + i.quantity, 0)}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatTaka(row.total_cents / 100)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <button
          type="button"
          aria-label={`View ${row.order_number}`}
          onClick={() => onView(row)}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  return (
    <section className="rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">All Orders</h2>

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
              placeholder="Search orders..."
              className="h-9 w-44 rounded-full border border-slate-200 bg-white pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
            />
          </div>
          <TableFilterPanel
            ariaLabel="Filter orders"
            fields={ORDER_FILTER_FIELDS}
            value={filters as unknown as Record<string, string>}
            empty={emptyOrderFilters as unknown as Record<string, string>}
            onChange={(next) =>
              onFiltersChange({
                status: (next.status ?? "") as OrderStatus | "",
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage="No orders match your search or filters"
      />
    </section>
  );
}
