"use client";

import { Truck } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { FulfillmentRequest, FulfillmentStatus } from "@/lib/dropship-mock";
import { useDropshipMock } from "./dropship-mock-context";
import { DropshipShell } from "./dropship-shell";
import { FulfillmentDetailModal } from "./fulfillment-detail-modal";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";

/** Orders resellers' customers placed for products THIS store supplies —
 * never mixed with this store's own Orders page. See the module note on
 * DropshipMockProvider: the reseller's own order lives entirely on their
 * own site, this is the separate, supplier-facing object it spawns. */
export function FulfillmentRequestsView() {
  const { fulfillmentRequests, updateFulfillmentStatus } = useDropshipMock();
  const { toast } = useToast();
  const [viewing, setViewing] = useState<FulfillmentRequest | null>(null);

  function handleStatusChange(id: string, status: FulfillmentStatus) {
    updateFulfillmentStatus(id, status);
    setViewing((v) => (v && v.id === id ? { ...v, status } : v));
    toast({
      title: status === "shipped" ? "Marked shipped" : "Request cancelled",
      variant: status === "shipped" ? "success" : "info",
    });
  }

  const columns: TableColumn<FulfillmentRequest>[] = [
    {
      id: "order",
      header: "Order",
      cell: (row) => (
        <button type="button" onClick={() => setViewing(row)} className="min-w-0 text-left">
          <p className="truncate font-semibold text-foreground hover:text-primary">
            {row.orderNumber}
          </p>
          <p className="truncate text-xs text-muted">from {row.resellerName}</p>
        </button>
      ),
    },
    {
      id: "product",
      header: "Product",
      cell: (row) => (
        <span className="text-muted">
          {row.productName} × {row.quantity}
        </span>
      ),
    },
    {
      id: "earn",
      header: "You earn",
      cell: (row) => (
        <span className="tabular-nums text-foreground">
          {formatTaka(row.wholesalePriceCents / 100)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <FulfillmentStatusBadge status={row.status} />,
    },
    {
      id: "created",
      header: "Placed",
      cell: (row) => (
        <span className="text-muted">{formatDisplayDate(new Date(row.createdAt))}</span>
      ),
    },
  ];

  return (
    <DropshipShell title="Fulfillment Requests">
      <p className="mb-4 text-sm text-muted">
        Orders from other stores reselling your products. Ship these yourself, same as your own
        inventory — they never show up on your regular Orders page.
      </p>
      {fulfillmentRequests.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No fulfillment requests yet"
          description="Once a reseller sells one of your listed products, it shows up here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={fulfillmentRequests}
          rowKey={(row) => row.id}
          emptyMessage="No requests match this search."
          pageSize={10}
        />
      )}

      <FulfillmentDetailModal
        request={viewing}
        onClose={() => setViewing(null)}
        onStatusChange={handleStatusChange}
      />
    </DropshipShell>
  );
}
