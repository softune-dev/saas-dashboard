"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import type { CreateTeammateIn, SuperAdminTenant } from "@/lib/api/superadmin";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];

type FormState = {
  tenant_id: string;
  email: string;
  password: string;
  full_name: string;
  role: CreateTeammateIn["role"];
};

type AddTeammateModalProps = {
  open: boolean;
  tenants: SuperAdminTenant[];
  busy?: boolean;
  onClose: () => void;
  onCreate: (data: CreateTeammateIn) => void;
};

export function AddTeammateModal({
  open,
  tenants,
  busy,
  onClose,
  onCreate,
}: AddTeammateModalProps) {
  const [form, setForm] = useState<FormState>({
    tenant_id: "",
    email: "",
    password: "",
    full_name: "",
    role: "member",
  });

  useEffect(() => {
    if (open) {
      setForm({
        tenant_id: tenants[0]?.id ?? "",
        email: "",
        password: "",
        full_name: "",
        role: "member",
      });
    }
  }, [open, tenants]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tenant_id || !form.email.trim() || form.password.length < 8) {
      return;
    }
    const payload: CreateTeammateIn = {
      tenant_id: form.tenant_id,
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };
    if (form.full_name.trim()) payload.full_name = form.full_name.trim();
    onCreate(payload);
  }

  return (
    <FormModal
      open={open}
      title="Add teammate"
      busy={busy}
      submitLabel="Add"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-muted">
          Give someone else a login into an existing customer&apos;s store. To
          onboard a brand-new customer, use Create Account on the Tenants page
          instead.
        </p>
        <SettingsSelect
          label="Tenant"
          value={form.tenant_id}
          options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(e) =>
            setForm((f) => ({ ...f, tenant_id: e.target.value }))
          }
        />
        <SettingsInput
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <SettingsInput
          label="Password"
          type="password"
          required
          minLength={8}
          hint="8–72 characters"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <SettingsInput
          label="Full name"
          value={form.full_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, full_name: e.target.value }))
          }
        />
        <SettingsSelect
          label="Role"
          value={form.role}
          options={ROLE_OPTIONS}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              role: e.target.value as CreateTeammateIn["role"],
            }))
          }
        />
      </div>
    </FormModal>
  );
}
