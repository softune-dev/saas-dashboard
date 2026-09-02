"use client";

import { Mail, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatDisplayDate } from "@/lib/format";
import {
  sendDemoMarketingEmail,
  useDemoRequestsSWR,
  type SuperAdminDemoAccess,
} from "@/lib/api/superadmin";

export function SuperAdminDemoRequestsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const { me, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const allowed = me?.user.is_superadmin === true;

  const [query, setQuery] = useState(urlQuery);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const {
    data: page,
    error: listError,
    isLoading,
  } = useDemoRequestsSWR({ q: debouncedQuery || undefined });

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const rows = page?.items ?? [];
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : "Failed to load demo requests"
    : null;

  async function handleSend(row: SuperAdminDemoAccess) {
    setSendingId(row.id);
    try {
      await sendDemoMarketingEmail(row.id);
      toast({ title: "Sent", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't send email",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSendingId(null);
    }
  }

  const columns: TableColumn<SuperAdminDemoAccess>[] = [
    {
      id: "email",
      header: "Email",
      cell: (row) => (
        <p className="truncate font-medium text-foreground">{row.email}</p>
      ),
    },
    {
      id: "count",
      header: "Requests",
      cell: (row) => (
        <span className="tabular-nums text-muted">{row.request_count}</span>
      ),
    },
    {
      id: "first",
      header: "First seen",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.first_requested_at))}
        </span>
      ),
    },
    {
      id: "last",
      header: "Last seen",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.last_requested_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => {
        const sending = sendingId === row.id;
        return (
          <button
            type="button"
            disabled={sending}
            aria-label={`Send marketing email to ${row.email}`}
            onClick={() => void handleSend(row)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted transition-colors hover:bg-search-bg hover:text-foreground disabled:opacity-60"
          >
            <Mail className="size-3.5" strokeWidth={1.75} />
            {sending ? "Sending…" : "Send email"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Demo requests" />

      {isLoading && rows.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : error ? (
        <EmptyState
          icon={Mail}
          title="Couldn't load demo requests"
          description={error}
        />
      ) : (
        <section className="rounded-md bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              All demo requests
              {page ? (
                <span className="ml-2 text-sm font-normal text-muted">
                  {page.total}
                </span>
              ) : null}
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
                placeholder="Search emails..."
                className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No demo requests match this search."
            pageSize={10}
          />
        </section>
      )}
    </div>
  );
}
