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
import { Building2, LifeBuoy, Loader2, Search, UserPlus, Users } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  listLeads,
  listTenants,
  listTickets,
  listUsers,
  type SuperAdminLead,
  type SuperAdminTenant,
  type SuperAdminTicket,
  type SuperAdminUser,
} from "@/lib/api/superadmin";

type SuperadminSearchBarProps = {
  className?: string;
};

type SearchHit = {
  kind: "user" | "tenant" | "lead" | "ticket";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const RESULT_LIMIT = 5;

function userHit(u: SuperAdminUser): SearchHit {
  return {
    kind: "user",
    id: u.id,
    title: u.full_name || u.email,
    subtitle: [u.email, u.tenant_name].filter(Boolean).join(" · "),
    href: `/superadmin/users?q=${encodeURIComponent(u.email)}`,
  };
}

function tenantHit(t: SuperAdminTenant): SearchHit {
  return {
    kind: "tenant",
    id: t.id,
    title: t.name,
    subtitle: `${t.slug} · ${t.plan}`,
    href: `/superadmin/tenants?q=${encodeURIComponent(t.name)}`,
  };
}

function leadHit(l: SuperAdminLead): SearchHit {
  return {
    kind: "lead",
    id: l.id,
    title: l.full_name || l.email,
    subtitle: [l.email, l.shop_name, l.status.replace(/_/g, " ")]
      .filter(Boolean)
      .join(" · "),
    href: `/superadmin/leads?q=${encodeURIComponent(l.email)}`,
  };
}

function ticketHit(t: SuperAdminTicket): SearchHit {
  return {
    kind: "ticket",
    id: t.id,
    title: t.ticket_number_display,
    subtitle: [t.subject, t.tenant_name, t.status].filter(Boolean).join(" · "),
    href: `/superadmin/tickets?q=${encodeURIComponent(t.subject)}`,
  };
}

async function fetchOmnibox(q: string) {
  const [usersPage, tenantsPage, leadsPage, ticketsPage] = await Promise.all([
    listUsers({ q, limit: RESULT_LIMIT }),
    listTenants({ q, limit: RESULT_LIMIT }),
    listLeads({ q, limit: RESULT_LIMIT }),
    listTickets({ q, limit: RESULT_LIMIT }),
  ]);
  return {
    users: usersPage.items.map(userHit),
    tenants: tenantsPage.items.map(tenantHit),
    leads: leadsPage.items.map(leadHit),
    tickets: ticketsPage.items.map(ticketHit),
  };
}

export function SuperadminSearchBar({
  className = "w-80 min-w-0 lg:w-96",
}: SuperadminSearchBarProps) {
  const id = useId();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 350);
  const activeQuery = debounced.length >= 2 ? debounced : "";

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { data, isLoading, isValidating } = useSWR(
    activeQuery ? ["superadmin-search", activeQuery] : null,
    ([, q]) => fetchOmnibox(q),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    },
  );

  const groups = useMemo(() => {
    if (!data) return [];
    return [
      { key: "users", label: "Users", icon: Users, items: data.users },
      { key: "tenants", label: "Tenants", icon: Building2, items: data.tenants },
      { key: "leads", label: "Leads", icon: UserPlus, items: data.leads },
      { key: "tickets", label: "Tickets", icon: LifeBuoy, items: data.tickets },
    ].filter((g) => g.items.length > 0);
  }, [data]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

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
    if (e.key === "Enter" && (!showPanel || flat.length === 0)) {
      const q = query.trim();
      if (q.length >= 2) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
        router.push(`/superadmin/users?q=${encodeURIComponent(q)}`);
      }
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
        Search users, tenants, leads, and tickets
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
        placeholder="Search users, tenants, leads, tickets..."
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
                              <Icon className="size-3.5" strokeWidth={1.75} />
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
