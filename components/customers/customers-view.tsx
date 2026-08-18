"use client";

import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { TableSkeleton } from "@/components/ui/table";
import { useOrdersSWR, type OrderOut } from "@/lib/api/commerce";
import {
  customerEmail,
  customerKey,
  customerName,
  customerPhone,
} from "@/lib/order-customer";
import type { DerivedCustomer } from "./customers-data";
import { CustomersStats } from "./customers-stats";
import {
  CustomersTable,
  emptyCustomerFilters,
  type CustomerFilters,
} from "./customers-table";

/** Collapse free-form Order.customer blobs into one row per unique buyer.
 * Prefer email, then phone; guests with neither stay as one row per order
 * so they don't all merge into a single "Guest". */
function deriveCustomers(orders: OrderOut[]): DerivedCustomer[] {
  const map = new Map<string, DerivedCustomer>();

  for (const order of orders) {
    const key = customerKey(order.customer, order.id);
    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.spentCents += order.total_cents;
      if (order.created_at < existing.firstOrderAt) {
        existing.firstOrderAt = order.created_at;
      }
      if (order.created_at > existing.lastOrderAt) {
        existing.lastOrderAt = order.created_at;
      }
      // Prefer a real name if a later order has one.
      const name = customerName(order.customer);
      if (existing.name === "Guest" && name !== "Guest") {
        existing.name = name;
      }
      if (!existing.email) existing.email = customerEmail(order.customer);
      if (!existing.phone) existing.phone = customerPhone(order.customer);
    } else {
      map.set(key, {
        id: key,
        name: customerName(order.customer),
        email: customerEmail(order.customer),
        phone: customerPhone(order.customer),
        orderCount: 1,
        spentCents: order.total_cents,
        firstOrderAt: order.created_at,
        lastOrderAt: order.created_at,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.spentCents - a.spentCents,
  );
}

export function CustomersView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const siteId = currentSite?.id ?? null;
  const [filters, setFilters] = useState<CustomerFilters>(emptyCustomerFilters);

  // No Customer table — customers are derived from order history. Same
  // {limit:100} cache key as Orders/Dashboard, so whichever of the three
  // loads first is the only one that pays the round-trip.
  const { data: page, error: ordersError, isLoading: loading } = useOrdersSWR(siteId, {
    limit: 100,
  });
  const orders = useMemo<OrderOut[]>(() => page?.items ?? [], [page]);
  const error = ordersError
    ? ordersError instanceof Error
      ? ordersError.message
      : "Failed to load customers"
    : null;

  const customers = useMemo(() => deriveCustomers(orders), [orders]);
  const showSkeleton =
    sessionLoading || (loading && currentSite && orders.length === 0);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Customers" />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={Users}
          title="No site yet"
          description="Create a site from a template in Themes before viewing customers."
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-white" />
            ))}
          </div>
          <TableSkeleton columns={5} />
        </>
      ) : error ? (
        <EmptyState icon={Users} title="Couldn't load customers" description={error} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers are derived from storefront orders. Once someone checks out, they'll appear here."
        />
      ) : (
        <>
          <CustomersStats customers={customers} />
          <CustomersTable
            customers={customers}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </>
      )}
    </div>
  );
}
