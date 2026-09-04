"use client";

import { Ban, Building2, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { RowActionsMenu } from "./row-actions-menu";
import { TenantStatusBadge } from "./status-badge";
import { TenantDetailModal } from "./tenant-detail-modal";

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
  const [viewing, setViewing] = useState<SuperAdminTenant | null>(null);
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
        <button
          type="button"
          onClick={() => setViewing(row)}
          className="min-w-0 text-left"
        >
          <p className="truncate font-semibold text-foreground hover:text-primary">{row.name}</p>
          <p className="truncate text-xs text-muted">{row.slug}</p>
        </button>
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
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <RowActionsMenu
          label={row.name}
          actions={[
            { label: "View details", icon: Eye, onClick: () => setViewing(row) },
            { label: "Edit", icon: Pencil, onClick: () => setEditing(row) },
            row.status !== "suspended"
              ? { label: "Ban", icon: Ban, onClick: () => setConfirming({ kind: "ban", tenant: row }) }
              : { label: "Ban", icon: Ban, onClick: () => {}, disabled: true },
            {
              label: "Delete",
              icon: Trash2,
              destructive: true,
              onClick: () => setConfirming({ kind: "delete", tenant: row }),
            },
          ]}
        />
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
      <TenantDetailModal tenant={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
