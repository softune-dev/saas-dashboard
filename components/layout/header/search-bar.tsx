"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, Package, Search, ShoppingBag, Users } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  listOrders,
  listProducts,
  type OrderOut,
  type ProductOut,
} from "@/lib/api/commerce";
import {
  customerEmail,
  customerKey,
  customerName,
  customerPhone,
} from "@/lib/order-customer";
import { formatTaka } from "@/lib/format";

type SearchBarProps = {
  className?: string;
};

type SearchHit = {
  kind: "product" | "order" | "customer";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Real thumbnail when available (products); otherwise the row falls back to an icon. */
  imageUrl?: string | null;
};

const RESULT_LIMIT = 5;

function deriveCustomerHits(orders: OrderOut[], q: string): SearchHit[] {
  const needle = q.toLowerCase();
  const map = new Map<string, SearchHit>();

  for (const order of orders) {
    const key = customerKey(order.customer, order.id);
    if (map.has(key)) continue;
    const name = customerName(order.customer);
    const email = customerEmail(order.customer);
    const phone = customerPhone(order.customer);
    const blob = `${name} ${email} ${phone}`.toLowerCase();
    if (!blob.includes(needle)) continue;
    const qParam = encodeURIComponent(email || phone || name);
    map.set(key, {
      kind: "customer",
      id: key,
      title: name,
      subtitle: [email, phone].filter(Boolean).join(" · ") || "Customer",
      href: `/customers?q=${qParam}`,
    });
    if (map.size >= RESULT_LIMIT) break;
  }

  return Array.from(map.values());
}

async function fetchGlobalSearch(siteId: string, q: string) {
  const [productsPage, ordersPage] = await Promise.all([
    listProducts(siteId, { q, limit: RESULT_LIMIT }),
    listOrders(siteId, { q, limit: 12 }),
  ]);

  const products: SearchHit[] = productsPage.items.map((p: ProductOut) => ({
    kind: "product" as const,
    id: p.id,
    title: p.name,
    subtitle: formatTaka(p.price_cents / 100),
    href: `/products/${p.id}/edit`,
    imageUrl: p.images[0]?.url ?? null,
  }));

  const orders: SearchHit[] = ordersPage.items.slice(0, RESULT_LIMIT).map((o) => ({
    kind: "order" as const,
    id: o.id,
    title: o.order_number,
    subtitle: `${customerName(o.customer)} · ${formatTaka(o.total_cents / 100)}`,
    href: `/orders?order=${o.id}`,
  }));

  const customers = deriveCustomerHits(ordersPage.items, q);

  return { products, orders, customers };
}

export function SearchBar({ className = "w-80 min-w-0" }: SearchBarProps) {
  const id = useId();
  const router = useRouter();
  const { currentSite } = useSession();
  const siteId = currentSite?.id ?? null;

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 350);
  const activeQuery = debounced.length >= 2 ? debounced : "";

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { data, isLoading, isValidating } = useSWR(
    siteId && activeQuery ? [siteId, "global-search", activeQuery] : null,
    ([id, , q]) => fetchGlobalSearch(id, q),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    },
  );

  const groups = useMemo(() => {
    if (!data) return [];
    return [
      { key: "products", label: "Products", icon: Package, items: data.products },
      { key: "orders", label: "Orders", icon: ShoppingBag, items: data.orders },
      { key: "customers", label: "Customers", icon: Users, items: data.customers },
    ].filter((g) => g.items.length > 0);
  }, [data]);

  const flat = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  const showPanel = open && query.trim().length >= 2;
  const busy = Boolean(activeQuery) && (isLoading || isValidating);

  useEffect(() => {
    setHighlight(0);
  }, [activeQuery, data]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (!showPanel || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[highlight] ?? flat[0];
      if (hit) go(hit);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-hit-index="${highlight}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  let runningIndex = -1;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-soft"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={`${id}-results`}
        aria-autocomplete="list"
        placeholder="Search products, orders, customers..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full bg-border pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-muted-soft transition-[color,background-color,box-shadow] focus:bg-surface focus:ring-1 focus:ring-primary"
        autoComplete="off"
      />

      {showPanel ? (
        <div
          id={`${id}-results`}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-[80] max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg dark:border-transparent"
        >
          {busy && !data ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Searching…
            </div>
          ) : flat.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <ul ref={listRef} className="flex flex-col gap-1">
              {groups.map((group) => (
                <li key={group.key}>
                  <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
                    {group.label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((hit) => {
                      runningIndex += 1;
                      const idx = runningIndex;
                      const active = idx === highlight;
                      const Icon = group.icon;
                      return (
                        <li key={`${hit.kind}-${hit.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            data-hit-index={idx}
                            onMouseEnter={() => setHighlight(idx)}
                            onClick={() => go(hit)}
                            className={[
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                              active
                                ? "bg-primary/10 text-foreground"
                                : "text-foreground hover:bg-search-bg",
                            ].join(" ")}
                          >
                            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg text-muted">
                              {hit.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={hit.imageUrl}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Icon className="size-3.5" strokeWidth={1.75} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {hit.title}
                              </span>
                              <span className="block truncate text-xs text-muted">
                                {hit.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
