"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsSelect } from "@/components/settings/site/ui/settings-field";
import type { SuperAdminTenant } from "@/lib/api/superadmin";

const PLAN_OPTIONS: { value: SuperAdminTenant["plan"]; label: string }[] = [
  { value: "trial", label: "Trial" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "business", label: "Business" },
  { value: "demo", label: "Demo" },
];

const STATUS_OPTIONS: { value: SuperAdminTenant["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

type EditTenantModalProps = {
  open: boolean;
  tenant: SuperAdminTenant | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (data: {
    plan: SuperAdminTenant["plan"];
    status: SuperAdminTenant["status"];
  }) => void;
};

export function EditTenantModal({
  open,
  tenant,
  busy,
  onClose,
  onSave,
}: EditTenantModalProps) {
  const [plan, setPlan] = useState<SuperAdminTenant["plan"]>("starter");
  const [status, setStatus] = useState<SuperAdminTenant["status"]>("active");

  useEffect(() => {
    if (open && tenant) {
      setPlan(tenant.plan);
      setStatus(tenant.status);
    }
  }, [open, tenant]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ plan, status });
  }

  return (
    <FormModal
      open={open}
      title={tenant ? `Edit ${tenant.name}` : "Edit tenant"}
      busy={busy}
      submitLabel="Save"
      compact
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <SettingsSelect
          label="Plan"
          value={plan}
          options={PLAN_OPTIONS}
          onChange={(e) =>
            setPlan(e.target.value as SuperAdminTenant["plan"])
          }
        />
        <SettingsSelect
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) =>
            setStatus(e.target.value as SuperAdminTenant["status"])
          }
        />
      </div>
    </FormModal>
  );
}
