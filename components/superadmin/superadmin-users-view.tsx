"use client";

import { Pencil, Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { DataTable, TableSkeleton, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate, formatRelativeTime } from "@/lib/format";
import {
  createTeammate,
  updateUser,
  useSuperAdminUsersSWR,
  useTenantsSWR,
  type CreateTeammateIn,
  type SuperAdminUser,
} from "@/lib/api/superadmin";
import { AddTeammateModal } from "./add-teammate-modal";
import { EditUserModal } from "./edit-user-modal";
import { UserActiveBadge } from "./status-badge";

export function SuperAdminUsersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const { me, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const allowed = me?.user.is_superadmin === true;

  const [query, setQuery] = useState(urlQuery);
  const [tenantId, setTenantId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [editing, setEditing] = useState<SuperAdminUser | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const { data: tenantsPage } = useTenantsSWR();
  const tenants = tenantsPage?.items ?? [];

  const {
    data: page,
    error: listError,
    isLoading,
    mutate,
  } = useSuperAdminUsersSWR({
    q: query.trim() || undefined,
    tenant_id: tenantId || undefined,
  });

  useEffect(() => {
    if (!sessionLoading && !allowed) router.replace("/");
  }, [sessionLoading, allowed, router]);

  if (sessionLoading || !allowed) return null;

  const users = page?.items ?? [];
  const error = listError
    ? listError instanceof Error
      ? listError.message
      : "Failed to load users"
    : null;

  async function handleCreate(data: CreateTeammateIn) {
    setCreateBusy(true);
    try {
      await createTeammate(data);
      await mutate();
      setCreateOpen(false);
      toast({ title: "Teammate added", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add teammate",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleSave(data: {
    role: SuperAdminUser["role"];
    is_active: boolean;
    is_superadmin: boolean;
    new_password?: string;
  }) {
    if (!editing) return;
    setEditBusy(true);
    try {
      await updateUser(editing.id, data);
      await mutate();
      setEditing(null);
      toast({ title: "User updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update user",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEditBusy(false);
    }
  }

  const columns: TableColumn<SuperAdminUser>[] = [
    {
      id: "user",
      header: "User",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {row.full_name || row.email}
          </p>
          {row.full_name ? (
            <p className="truncate text-xs text-muted">{row.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: (row) => <span className="text-muted">{row.tenant_name}</span>,
    },
    {
      id: "role",
      header: "Role",
      cell: (row) => (
        <span className="capitalize text-muted">{row.role}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <UserActiveBadge active={row.is_active} />,
    },
    {
      id: "login",
      header: "Last login",
      cell: (row) => (
        <span className="text-muted">
          {row.last_login_at
            ? formatRelativeTime(new Date(row.last_login_at))
            : "Never"}
        </span>
      ),
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
        <button
          type="button"
          aria-label={`Edit ${row.email}`}
          onClick={() => setEditing(row)}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
        >
          <Pencil className="size-3.5" strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title="Users"
        actionsInline
        actions={
          <PrimaryButton onClick={() => setCreateOpen(true)} className="px-4">
            <Plus className="size-4" strokeWidth={2} />
            <span className="hidden sm:inline">Add teammate</span>
          </PrimaryButton>
        }
      />

      {isLoading && users.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : error ? (
        <EmptyState icon={Users} title="Couldn't load users" description={error} />
      ) : (
        <section className="rounded-md bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              All users
              {page ? (
                <span className="ml-2 text-sm font-normal text-muted">
                  {page.total}
                </span>
              ) : null}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users..."
                  className="h-9 w-44 rounded-full border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-soft focus:border-primary sm:w-56"
                />
              </div>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                aria-label="Filter by tenant"
                className="h-9 rounded-full border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">All tenants</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={users}
            rowKey={(row) => row.id}
            emptyMessage="No users match this search."
            pageSize={10}
          />
        </section>
      )}

      <AddTeammateModal
        open={createOpen}
        tenants={tenants}
        busy={createBusy}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
      <EditUserModal
        open={editing !== null}
        user={editing}
        busy={editBusy}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  );
}
