"use client";

import { Ban, Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, trialDaysLeft } from "@/lib/format";
import {
  createAccount,
  deleteTenant,
  updateTenant,
  useTenantsSWR,
  type CreateAccountIn,
  type SuperAdminTenant,
} from "@/lib/api/superadmin";
import { CreateAccountModal } from "./create-account-modal";
import { EditTenantModal } from "./edit-tenant-modal";
import { TenantStatusBadge } from "./status-badge";

export function SuperAdminTenantsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const { me, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const allowed = me?.user.is_superadmin === true;

  const [query, setQuery] = useState(urlQuery);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [editing, setEditing] = useState<SuperAdminTenant | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [confirming, setConfirming] = useState<{
    kind: "ban" | "delete";
    tenant: SuperAdminTenant;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const {
    data: page,
    error: listError,
    isLoading,
    mutate,
  } = useTenantsSWR({ q: query.trim() || undefined });

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const tenants = page?.items ?? [];
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : "Failed to load tenants"
    : null;

  async function handleCreate(data: CreateAccountIn) {
    setCreateBusy(true);
    try {
      await createAccount(data);
      await mutate();
      setCreateOpen(false);
      toast({ title: "Account created", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't create account",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleSave(data: {
    plan: SuperAdminTenant["plan"];
    status: SuperAdminTenant["status"];
  }) {
    if (!editing) return;
    setEditBusy(true);
    try {
      await updateTenant(editing.id, data);
      await mutate();
      setEditing(null);
      toast({ title: "Tenant updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update tenant",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEditBusy(false);
    }
  }

  async function handleConfirm() {
    if (!confirming) return;
    setConfirmBusy(true);
    try {
      if (confirming.kind === "ban") {
        await updateTenant(confirming.tenant.id, { status: "suspended" });
        toast({ title: "Tenant banned", variant: "success" });
      } else {
        await deleteTenant(confirming.tenant.id);
        toast({ title: "Tenant deleted", variant: "success" });
      }
      await mutate();
      setConfirming(null);
    } catch (err) {
      toast({
        title:
          confirming.kind === "ban"
            ? "Couldn't ban tenant"
            : "Couldn't delete tenant",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setConfirmBusy(false);
    }
  }

  const columns: TableColumn<SuperAdminTenant>[] = [
    {
      id: "name",
      header: "Tenant",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{row.name}</p>
          <p className="truncate text-xs text-muted">{row.slug}</p>
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: (row) => {
        if (row.plan !== "trial") {
          return <span className="capitalize text-muted">{row.plan}</span>;
        }
        const days = trialDaysLeft(row.trial_expires_at);
        const countdown =
          days <= 0
            ? "last day"
            : days === 1
              ? "1 day left"
              : `${days} days left`;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="capitalize text-muted">Trial</span>
            <span className="inline-flex w-fit rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              {countdown}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <TenantStatusBadge status={row.status} />,
    },
    {
      id: "content",
      header: "Categories / Products / Orders",
      cell: (row) => (
        <span className="text-muted">
          {row.category_count ?? 0} / {row.product_count ?? 0} / {row.order_count ?? 0}
        </span>
      ),
    },
    {
      id: "integrations",
      header: "Payment / Courier",
      // Guarded against undefined: a stale SWR-persisted cache from before
      // these fields existed on the response can render one frame before
      // revalidation replaces it with the real shape.
      cell: (row) => {
        const payments = row.payment_providers ?? [];
        const couriers = row.courier_providers ?? [];
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className={payments.length ? "text-foreground" : "text-muted-soft"}>
              {payments.length ? payments.join(", ") : "None"}
            </span>
            <span className={couriers.length ? "text-foreground" : "text-muted-soft"}>
              {couriers.length ? couriers.join(", ") : "No courier"}
            </span>
          </div>
        );
      },
    },
    {
      id: "billing",
      header: "Billing",
      cell: (row) => {
        const label = row.business?.trade_name || row.business?.legal_name;
        return label ? (
          <span className="truncate text-muted">{label}</span>
        ) : (
          <span className="text-muted-soft">Not set</span>
        );
      },
    },
    {
      id: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-muted">
          {formatDisplayDate(new Date(row.created_at))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <div className="inline-flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => setEditing(row)}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
          {row.status !== "suspended" ? (
            <button
              type="button"
              aria-label={`Ban ${row.name}`}
              onClick={() => setConfirming({ kind: "ban", tenant: row })}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-amber-500/10 hover:text-amber-700"
            >
              <Ban className="size-3.5" strokeWidth={1.75} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            onClick={() => setConfirming({ kind: "delete", tenant: row })}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Tenants"
        actionsInline
        actions={
          <PrimaryButton onClick={() => setCreateOpen(true)} className="px-4">
            <Plus className="size-4" strokeWidth={2} />
            <span className="hidden sm:inline">Create account</span>
          </PrimaryButton>
        }
      />

      {isLoading && tenants.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : error ? (
        <EmptyState
          icon={Building2}
          title="Couldn't load tenants"
          description={error}
        />
      ) : (
        <section className="rounded-md bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              All tenants
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
                placeholder="Search tenants..."
                className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={tenants}
            rowKey={(row) => row.id}
            emptyMessage="No tenants match this search."
            pageSize={10}
          />
        </section>
      )}

      <CreateAccountModal
        open={createOpen}
        busy={createBusy}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
      <EditTenantModal
        open={editing !== null}
        tenant={editing}
        busy={editBusy}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.kind === "delete"
            ? `Permanently delete ${confirming.tenant.name}?`
            : `Ban ${confirming?.tenant.name}?`
        }
        description={
          confirming?.kind === "delete"
            ? "This is a hard, irreversible delete. The tenant, store, products, orders, and users will be erased and cannot be recovered."
            : "They will be suspended and cannot log in. You can unsuspend them later from Edit."
        }
        confirmLabel={confirming?.kind === "delete" ? "Delete forever" : "Ban"}
        destructive
        busy={confirmBusy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
