"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ImageOff,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "@/components/providers/session-provider";
import { OutlineButton } from "@/components/ui/outline-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TablePagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import {
  createOrder,
  updateOrderStatus,
  useCategoriesSWR,
  useOrdersSWR,
  useProductsSWR,
  type OrderOut,
  type OrderStatus,
  type ProductOut,
} from "@/lib/api/commerce";
import {
  customerName as orderCustomerName,
  customerPhone as orderCustomerPhone,
} from "@/lib/order-customer";
import type { SiteOut } from "@/lib/api";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

/** Even page size so 2-col layout fills evenly; 1-col just shows the same rows. */
const PAGE_SIZE = 24;
/** Client-side page size for POS-filtered recent sales (no channel API filter yet). */
const RECENT_PAGE_SIZE = 10;

/** Payment is just a label recorded on the order (see OrderCreate.meta.
 * payment_method) — there's no in-person card/mobile-banking gateway
 * integration behind this yet, it's purely what the merchant collected. */
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
];

type CartLine = {
  product: ProductOut;
  quantity: number;
};

/**
 * Store Sale — walk-in / counter checkout against the live catalog
 * (POST /sites/{id}/orders, channel="pos"). Not a full register: no cash
 * drawer session, no dedicated barcode SDK (USB scanners type into search),
 * receipt via browser print.
 */
export function NewSalePage() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);

  const { data: categories = [] } = useCategoriesSWR(siteId);
  const { data: results, isLoading: searching } = useProductsSWR(siteId, {
    q: query.trim() || undefined,
    category_id: categoryId ?? undefined,
    active_only: true,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  // No channel filter on the API yet — fetch a wider window, filter POS, paginate client-side.
  const {
    data: ordersPage,
    isLoading: recentLoading,
    mutate: mutateRecentOrders,
  } = useOrdersSWR(siteId, { limit: 100 });

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderOut | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderOut | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const products = results?.items ?? [];
  const totalProducts = results?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const recentPosOrders = useMemo(
    () =>
      (ordersPage?.items ?? []).filter(
        (o) => (o.channel ?? "storefront") === "pos",
      ),
    [ordersPage],
  );
  const recentTotal = recentPosOrders.length;
  const recentTotalPages = Math.max(1, Math.ceil(recentTotal / RECENT_PAGE_SIZE));
  const pagedRecentOrders = useMemo(() => {
    const safePage = Math.min(recentPage, recentTotalPages);
    const start = (safePage - 1) * RECENT_PAGE_SIZE;
    return recentPosOrders.slice(start, start + RECENT_PAGE_SIZE);
  }, [recentPosOrders, recentPage, recentTotalPages]);
  const itemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  function setCategory(next: string | null) {
    setCategoryId(next);
    setPage(1);
  }

  function setSearch(next: string) {
    setQuery(next);
    setPage(1);
  }
  const subtotalCents = useMemo(
    () =>
      cart.reduce(
        (sum, line) => sum + line.product.price_cents * line.quantity,
        0,
      ),
    [cart],
  );

  function addToCart(product: ProductOut) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        const max = product.track_stock ? product.stock : Infinity;
        if (existing.quantity >= max) return prev;
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) =>
            l.product.id === productId ? { ...l, quantity } : l,
          ),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function resetSale() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod(PAYMENT_METHODS[0].value);
    setCompletedOrder(null);
  }

  async function handleCompleteSale() {
    if (!siteId || cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      const order = await createOrder(siteId, {
        items: cart.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
        })),
        customer: {
          name: customerName.trim() || undefined,
          phone: customerPhone.trim() || undefined,
        },
        meta: { payment_method: paymentMethod, source: "pos" },
        channel: "pos",
      });
      // Clear the counter for the next walk-in while the success modal stays open.
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod(PAYMENT_METHODS[0].value);
      setCompletedOrder(order);
      setRecentPage(1);
      void mutateRecentOrders();
    } catch (err) {
      toast({
        title: "Couldn't complete the sale",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setPlacing(false);
    }
  }

  async function handleRecentStatusChange(
    order: OrderOut,
    status: OrderStatus,
  ) {
    if (!siteId) return;
    setStatusBusy(true);
    try {
      const updated = await updateOrderStatus(siteId, order.id, status);
      setViewingOrder(updated);
      await mutateRecentOrders(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
          };
        },
        { revalidate: false },
      );
    } catch (err) {
      toast({
        title: "Couldn't update status",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start lg:gap-5">
        {/* Catalog */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-md bg-surface lg:col-span-3 lg:max-h-[calc(100dvh-6.5rem)]">
          <div className="shrink-0 space-y-3 border-b border-border p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">
                Products
              </h2>
              <span className="text-xs text-muted tabular-nums">
                {searching
                  ? "…"
                  : `${totalProducts} product${totalProducts === 1 ? "" : "s"}`}
              </span>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft"
                strokeWidth={1.75}
              />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU (scanner works here)"
                className="h-11 w-full rounded-full border border-border bg-search-bg pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="scrollbar-auto-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              <CategoryChip
                label="All"
                active={categoryId === null}
                onClick={() => setCategory(null)}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  active={categoryId === cat.id}
                  onClick={() => setCategory(cat.id)}
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {searching ? (
              <p className="px-4 py-10 text-center text-sm text-muted sm:px-5">
                Loading products…
              </p>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center sm:px-5">
                <ShoppingBag
                  className="size-8 text-muted-soft"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">
                  {query || categoryId
                    ? "No products match"
                    : "No active products"}
                </p>
                <p className="max-w-xs text-xs text-muted">
                  {query
                    ? "Try another search or clear the category filter."
                    : "Add products in the catalog to sell them here."}
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 xl:grid-cols-2">
                {products.map((product) => {
                  const outOfStock =
                    product.track_stock && product.stock <= 0;
                  const inCart = cart.find(
                    (l) => l.product.id === product.id,
                  );
                  return (
                    <li
                      key={product.id}
                      className="border-b border-border xl:odd:border-r"
                    >
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(product)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-search-bg disabled:cursor-not-allowed disabled:opacity-45 sm:px-5"
                      >
                        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg">
                          {product.images[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageOff
                              className="size-4 text-muted-soft"
                              strokeWidth={1.5}
                            />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {product.name}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                            <span className="font-semibold tabular-nums text-foreground">
                              {formatTaka(product.price_cents / 100)}
                            </span>
                            {outOfStock ? (
                              <span className="text-red-500">Out of stock</span>
                            ) : product.track_stock ? (
                              <span>{product.stock} left</span>
                            ) : null}
                            {product.sku ? (
                              <span className="truncate text-muted-soft">
                                {product.sku}
                              </span>
                            ) : null}
                          </span>
                        </span>

                        <span
                          className={[
                            "flex size-8 shrink-0 items-center justify-center rounded-full",
                            inCart
                              ? "bg-primary text-white"
                              : "border border-border text-muted",
                          ].join(" ")}
                        >
                          {inCart ? (
                            <span className="text-xs font-bold tabular-nums">
                              {inCart.quantity}
                            </span>
                          ) : (
                            <Plus className="size-4" strokeWidth={2} />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {totalProducts > PAGE_SIZE ? (
            <div className="shrink-0">
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalProducts}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </section>

        {/* Current sale — fixed to viewport height; does not stretch with the product list */}
        <section className="flex h-[min(70dvh,36rem)] max-h-[70dvh] min-h-0 flex-col overflow-hidden rounded-md bg-surface lg:sticky lg:top-0 lg:col-span-2 lg:h-[calc(100dvh-6.5rem)] lg:max-h-[calc(100dvh-6.5rem)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Current sale
              </h2>
              <p className="text-xs text-muted tabular-nums">
                {itemCount === 0
                  ? "No items yet"
                  : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
              </p>
            </div>
            {cart.length > 0 ? (
              <OutlineButton
                onClick={resetSale}
                className="h-9 px-3 text-xs"
                disabled={placing}
              >
                Clear
              </OutlineButton>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-search-bg">
                  <ShoppingBag
                    className="size-5 text-muted-soft"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Sale is empty
                </p>
                <p className="max-w-[14rem] text-xs text-muted">
                  Tap a product on the left to add it here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cart.map((line) => {
                  const lineTotal =
                    line.product.price_cents * line.quantity;
                  const atMax =
                    line.product.track_stock &&
                    line.quantity >= line.product.stock;
                  return (
                    <li
                      key={line.product.id}
                      className="flex items-start gap-3 px-4 py-3 sm:px-5"
                    >
                      <span className="relative mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg">
                        {line.product.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={line.product.images[0].url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageOff
                            className="size-3.5 text-muted-soft"
                            strokeWidth={1.5}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {line.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted tabular-nums">
                          {formatTaka(line.product.price_cents / 100)} each
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-border bg-search-bg p-0.5">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setQuantity(
                                  line.product.id,
                                  line.quantity - 1,
                                )
                              }
                              className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
                            >
                              <Minus className="size-3.5" strokeWidth={2} />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold tabular-nums text-foreground">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={atMax}
                              onClick={() =>
                                setQuantity(
                                  line.product.id,
                                  line.quantity + 1,
                                )
                              }
                              className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="size-3.5" strokeWidth={2} />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label={`Remove ${line.product.name}`}
                            onClick={() => removeLine(line.product.id)}
                            className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatTaka(lineTotal / 100)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t border-border p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="h-10 rounded-full border border-border bg-search-bg px-3.5 text-sm outline-none placeholder:text-muted-soft focus:border-primary focus:bg-surface"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="h-10 rounded-full border border-border bg-search-bg px-3.5 text-sm outline-none placeholder:text-muted-soft focus:border-primary focus:bg-surface"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={[
                      "h-10 rounded-full border text-xs font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-search-bg text-muted hover:border-primary/40 hover:text-foreground",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-end justify-between gap-3 rounded-xl bg-search-bg px-3.5 py-3">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  Total
                </p>
                <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatTaka(subtotalCents / 100)}
                </p>
              </div>
              <p className="pb-0.5 text-xs text-muted tabular-nums">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>

            <PrimaryButton
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || placing}
              className="h-12 w-full text-sm font-semibold"
            >
              {placing ? "Completing…" : "Complete Sale"}
            </PrimaryButton>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-md bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Recent Sales
            </h2>
            <p className="text-xs text-muted">
              Walk-in orders from Store Sale
            </p>
          </div>
          <span className="text-xs text-muted tabular-nums">
            {recentLoading
              ? "…"
              : `${recentTotal} sale${recentTotal === 1 ? "" : "s"}`}
          </span>
        </div>

        {recentLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted sm:px-5">
            Loading recent sales…
          </p>
        ) : recentTotal === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center sm:px-5">
            <ShoppingBag
              className="size-7 text-muted-soft"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium text-foreground">
              No store sales yet
            </p>
            <p className="max-w-xs text-xs text-muted">
              Completed Store Sale orders will show up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {pagedRecentOrders.map((order) => {
                const name = orderCustomerName(order.customer ?? {});
                const time = new Date(order.created_at).toLocaleTimeString(
                  undefined,
                  { hour: "2-digit", minute: "2-digit" },
                );
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setViewingOrder(order)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-search-bg sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {order.order_number}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {formatDisplayDate(new Date(order.created_at))} ·{" "}
                          {time}
                          {name && name !== "Guest" ? ` · ${name}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatTaka(order.total_cents / 100)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {recentTotal > RECENT_PAGE_SIZE ? (
              <TablePagination
                page={Math.min(recentPage, recentTotalPages)}
                totalPages={recentTotalPages}
                totalItems={recentTotal}
                pageSize={RECENT_PAGE_SIZE}
                onPageChange={setRecentPage}
              />
            ) : null}
          </>
        )}
      </section>

      <SaleSuccessModal
        order={completedOrder}
        site={currentSite}
        onClose={resetSale}
      />

      <OrderDetailModal
        open={!!viewingOrder}
        order={viewingOrder}
        busy={statusBusy}
        onClose={() => setViewingOrder(null)}
        onStatusChange={handleRecentStatusChange}
      />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-8 shrink-0 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-search-bg text-muted hover:border-primary/40 hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function paymentLabel(method?: string | null): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    case "mobile_banking":
      return "Mobile Banking";
    case "cod":
      return "Cash on Delivery";
    case "bkash":
      return "bKash";
    case "nagad":
      return "Nagad";
    default:
      return method?.trim() ? method : "Cash";
  }
}

function shopFromSite(site: SiteOut | null | undefined) {
  const business = (site?.business ?? {}) as Record<string, unknown>;
  const address = (business.address ?? {}) as Record<string, unknown>;
  const pick = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : "";

  const name = pick(business.name) || site?.name || "Store";
  const phone = pick(business.phone) || pick(business.whatsapp);
  const email = pick(business.email);
  const line = [
    pick(address.street),
    pick(address.city),
    pick(address.region),
    pick(address.postal_code),
  ]
    .filter(Boolean)
    .join(", ");
  const country = pick(address.country);

  return { name, phone, email, address: line, country };
}

/** Success dialog after Complete Sale — keeps the POS screen underneath. */
function SaleSuccessModal({
  order,
  site,
  onClose,
}: {
  order: OrderOut | null;
  site: SiteOut | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {order ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 print:static print:block print:bg-white print:p-0">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 print:hidden"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-success-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-[380px] flex-col overflow-hidden rounded-2xl bg-surface print:max-h-none print:max-w-[80mm] print:rounded-none print:bg-white print:text-black print:shadow-none"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 print:hidden dark:border-transparent">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="size-5 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2}
                />
                <h3
                  id="sale-success-title"
                  className="text-[15px] font-semibold text-foreground"
                >
                  Sale complete
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 print:overflow-visible print:px-2 print:py-2">
              <PosThermalReceipt order={order} site={site} />
            </div>

            <div className="flex shrink-0 gap-2 border-t border-border px-5 py-4 print:hidden dark:border-transparent">
              <OutlineButton
                onClick={() => window.print()}
                className="h-11 flex-1"
              >
                <Printer className="size-4" strokeWidth={1.75} />
                Print
              </OutlineButton>
              <PrimaryButton onClick={onClose} className="h-11 flex-1">
                New Sale
              </PrimaryButton>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Narrow thermal-style slip: shop header, date/time, lines, totals, thanks. */
function PosThermalReceipt({
  order,
  site,
}: {
  order: OrderOut;
  site: SiteOut | null;
}) {
  const shop = shopFromSite(site);
  const created = new Date(order.created_at);
  const dateStr = created.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeStr = created.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const buyerName = orderCustomerName(order.customer ?? {});
  const buyerPhone = orderCustomerPhone(order.customer ?? {});
  const pay = paymentLabel(order.meta?.payment_method);
  const itemCount = (order.items ?? []).reduce((n, i) => n + i.quantity, 0);

  return (
    <div
      id="pos-receipt"
      className="mx-auto w-full max-w-[320px] bg-white px-3 py-4 text-black shadow-sm ring-1 ring-black/5 print:max-w-none print:px-0 print:py-0 print:shadow-none print:ring-0"
    >
      <div className="text-center font-mono">
        <p className="text-[15px] font-bold tracking-wide uppercase">
          {shop.name}
        </p>
        {shop.address ? (
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-600">
            {shop.address}
            {shop.country ? `, ${shop.country}` : ""}
          </p>
        ) : null}
        {shop.phone ? (
          <p className="text-[10px] text-neutral-600">Tel: {shop.phone}</p>
        ) : null}
        {shop.email ? (
          <p className="text-[10px] text-neutral-600">{shop.email}</p>
        ) : null}
      </div>

      <div className="my-3 border-t border-dashed border-neutral-300" />

      <div className="space-y-0.5 font-mono text-[10px] text-neutral-700">
        <ReceiptRow label="Date" value={dateStr} />
        <ReceiptRow label="Time" value={timeStr} />
        <ReceiptRow label="Order" value={order.order_number} />
        <ReceiptRow label="Channel" value="Store Sale" />
        <ReceiptRow label="Payment" value={pay} />
        {buyerName && buyerName !== "Guest" ? (
          <ReceiptRow label="Customer" value={buyerName} />
        ) : null}
        {buyerPhone ? <ReceiptRow label="Phone" value={buyerPhone} /> : null}
      </div>

      <div className="my-3 border-t border-dashed border-neutral-300" />

      <div className="mb-1.5 flex font-mono text-[9px] font-semibold tracking-wide text-neutral-500 uppercase">
        <span className="flex-1">Item</span>
        <span className="w-8 text-center">Qty</span>
        <span className="w-16 text-right">Amount</span>
      </div>

      <ul className="space-y-2 font-mono text-[11px] text-neutral-900">
        {(order.items ?? []).map((item) => (
          <li key={item.id}>
            <div className="flex items-start gap-2">
              <span className="min-w-0 flex-1 leading-snug break-words">
                {item.name_snapshot}
              </span>
              <span className="w-8 shrink-0 text-center tabular-nums">
                {item.quantity}
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums">
                {formatTaka(item.total_cents / 100)}
              </span>
            </div>
            <p className="mt-0.5 text-[9px] text-neutral-500 tabular-nums">
              {formatTaka(item.unit_price_cents / 100)} each
            </p>
          </li>
        ))}
      </ul>

      <div className="my-3 border-t border-dashed border-neutral-300" />

      <div className="space-y-1 font-mono text-[11px] text-neutral-800">
        <ReceiptRow
          label={`Items (${itemCount})`}
          value={formatTaka(order.subtotal_cents / 100)}
        />
        {order.tax_cents > 0 ? (
          <ReceiptRow
            label="Tax"
            value={formatTaka(order.tax_cents / 100)}
          />
        ) : null}
        {order.shipping_cents > 0 ? (
          <ReceiptRow
            label="Shipping"
            value={formatTaka(order.shipping_cents / 100)}
          />
        ) : null}
        <div className="flex items-center justify-between pt-1 text-[13px] font-bold text-black">
          <span>TOTAL</span>
          <span className="tabular-nums">
            {formatTaka(order.total_cents / 100)}
          </span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-neutral-300" />

      <div className="text-center font-mono">
        <p className="text-[11px] font-semibold tracking-wide text-neutral-800">
          Thank you for shopping
        </p>
        <p className="mt-1 text-[9px] text-neutral-500">
          Please keep this receipt for your records
        </p>
        {site?.subdomain ? (
          <p className="mt-2 text-[9px] text-neutral-400">
            {site.custom_domain || `${site.subdomain}.${process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softunebd.com"}`}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="min-w-0 text-right break-all text-neutral-800">
        {value}
      </span>
    </div>
  );
}
