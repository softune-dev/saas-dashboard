"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import { customerName } from "@/lib/order-customer";
import type { OrderOut } from "@/lib/api/commerce";

export function RecentOrders({ orders }: { orders: OrderOut[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const name = customerName(order.customer).toLowerCase();
      return (
        order.order_number.toLowerCase().includes(q) ||
        name.includes(q) ||
        order.status.toLowerCase().includes(q)
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
      cell: (row) => customerName(row.customer),
    },
    {
      id: "items",
      header: "Items",
      cell: (row) => row.items.reduce((n, i) => n + i.quantity, 0),
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
  ];

  return (
    <section className="rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Recent Orders
        </h2>

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
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage="No orders match your search"
      />
    </section>
  );
}
