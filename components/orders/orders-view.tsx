"use client";

import { ShoppingBag, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TableSkeleton } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  markNotificationRead,
  useNotificationsSWR,
} from "@/lib/api/notifications";
import {
  getOrder,
  updateOrderStatus,
  useOrdersSWR,
  type OrderOut,
  type OrderStatus,
} from "@/lib/api/commerce";
import { BulkBookCourierModal } from "./bulk-book-courier-modal";
import { OrderDetailModal } from "./order-detail-modal";
import { OrdersStats } from "./orders-stats";
import {
  emptyOrderFilters,
  OrdersTable,
  type OrderFilters,
} from "./orders-table";

export function OrdersView() {
  const { t } = useLanguage();
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const siteId = currentSite?.id ?? null;

  const [filters, setFilters] = useState<OrderFilters>(emptyOrderFilters);

  const [viewing, setViewing] = useState<OrderOut | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [bulkBookOpen, setBulkBookOpen] = useState(false);

  const { data: notifications = [], mutate: mutateNotifications } =
    useNotificationsSWR(siteId);

  const hasClearedUnreadRef = useRef(false);

  useEffect(() => {
    if (!siteId || hasClearedUnreadRef.current || notifications.length === 0) return;

    const unreadOrderNotifs = notifications.filter(
      (n) => n.type === "order_created" && !n.read_at
    );

    if (unreadOrderNotifs.length === 0) return;

    hasClearedUnreadRef.current = true;
    const now = new Date().toISOString();
    const unreadIds = new Set(unreadOrderNotifs.map((n) => n.id));

    mutateNotifications(
      (prev = []) =>
        prev.map((n) => (unreadIds.has(n.id) ? { ...n, read_at: now } : n)),
      false
    );

    unreadOrderNotifs.forEach((n) => {
      markNotificationRead(siteId, n.id).catch(() => {});
    });
  }, [siteId, notifications, mutateNotifications]);

  // Same cache key shape as Dashboard/Customers when unfiltered ({limit:100},
  // no status) — visiting any of those three first means the other two load
  // from cache instantly instead of paying their own round-trip.
  const {
    data: page,
    error: ordersError,
    isLoading: ordersLoading,
    mutate: mutateOrders,
  } = useOrdersSWR(siteId, {
    status: filters.status || undefined,
    limit: 100,
  });
  const orders = page?.items ?? [];
  const total = page?.total ?? 0;
  const loading = ordersLoading;
  const error = ordersError
    ? ordersError instanceof Error
      ? ordersError.message
      : t("Failed to load orders")
    : null;

  // Deep-link from header search: /orders?order=<id>
  const deepOrderId = searchParams.get("order");
  const openedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    if (!siteId || !deepOrderId || openedDeepLink.current === deepOrderId) return;
    const cached = orders.find((o) => o.id === deepOrderId);
    if (cached) {
      openedDeepLink.current = deepOrderId;
      setViewing(cached);
      return;
    }
    let cancelled = false;
    getOrder(siteId, deepOrderId)
      .then((order) => {
        if (cancelled) return;
        openedDeepLink.current = deepOrderId;
        setViewing(order);
      })
      .catch(() => {
        /* missing/unauthorized — leave list as-is */
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, deepOrderId, orders]);

  async function handleStatusChange(order: OrderOut, status: OrderStatus) {
    if (!currentSite || order.status === status) return;
    setStatusBusy(true);
    try {
      const updated = await updateOrderStatus(currentSite.id, order.id, status);
      // Status filter is applied server-side — drop the row if it no longer
      // matches, so the table doesn't show a "paid" order under Pending.
      await mutateOrders(
        (prev) => {
          if (!prev) return prev;
          if (filters.status && updated.status !== filters.status) {
            return {
              ...prev,
              items: prev.items.filter((o) => o.id !== updated.id),
              total: Math.max(0, prev.total - 1),
            };
          }
          return {
            ...prev,
            items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
          };
        },
        { revalidate: false },
      );
      setViewing((v) =>
        v?.id === updated.id
          ? filters.status && updated.status !== filters.status
            ? null
            : updated
          : v,
      );
      toast({ title: `Order marked ${status}`, variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update status",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setStatusBusy(false);
    }
  }

  function handleCourierBooked(updated: OrderOut) {
    mutateOrders(
      (prev) => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.map((o) => (o.id === updated.id ? updated : o)) };
      },
      { revalidate: false },
    );
    setViewing((v) => (v?.id === updated.id ? updated : v));
  }

  const hasFilters = Boolean(filters.status);
  const showSkeleton =
    sessionLoading || (loading && currentSite && orders.length === 0 && !hasFilters);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title={t("Orders")}
        actionsInline
        actions={
          currentSite ? (
            <PrimaryButton onClick={() => setBulkBookOpen(true)} className="px-4">
              <Truck className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t("Bulk book courier")}</span>
            </PrimaryButton>
          ) : undefined
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("No site yet")}
          description={t("Create a site from a template in Themes before managing orders.")}
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-surface" />
            ))}
          </div>
          <TableSkeleton columns={6} />
        </>
      ) : error ? (
        <EmptyState icon={ShoppingBag} title={t("Couldn't load orders")} description={error} />
      ) : orders.length === 0 && !hasFilters ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("No orders yet")}
          description={t("Orders from your storefront checkout will show up here.")}
        />
      ) : (
        <>
          <OrdersStats orders={orders} totalCount={total} />
          <OrdersTable
            orders={orders}
            filters={filters}
            onFiltersChange={setFilters}
            onView={setViewing}
          />
        </>
      )}

      <OrderDetailModal
        open={!!viewing}
        order={viewing}
        busy={statusBusy}
        onClose={() => setViewing(null)}
        onStatusChange={handleStatusChange}
        onCourierBooked={handleCourierBooked}
      />
      <BulkBookCourierModal
        open={bulkBookOpen}
        siteId={siteId}
        onClose={() => setBulkBookOpen(false)}
        onBooked={() => mutateOrders()}
      />
    </div>
  );
}
