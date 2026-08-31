"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import type {
  ConvertLeadIn,
  SuperAdminLead,
  SuperAdminTenant,
} from "@/lib/api/superadmin";

const PLAN_OPTIONS: { value: SuperAdminTenant["plan"]; label: string }[] = [
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "business", label: "Business" },
  { value: "demo", label: "Demo" },
];

const TEMPLATE_OPTIONS = [
  { value: "aurora", label: "Aurora (Fashion)" },
  { value: "bazaar", label: "Bazaar (Emporium)" },
  { value: "sweets", label: "Sweets (Vault)" },
];

type FormState = {
  workspace_name: string;
  plan: SuperAdminTenant["plan"];
  template_key: string;
  site_name: string;
  subdomain: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function seedFromLead(lead: SuperAdminLead | null): FormState {
  const shop = lead?.shop_name?.trim() || "";
  const workspace =
    shop || lead?.full_name?.trim() || lead?.email.split("@")[0] || "";
  const site_name = shop || workspace;
  return {
    workspace_name: workspace,
    plan: "starter",
    template_key: "aurora",
    site_name,
    subdomain: slugify(site_name),
  };
}

type ConvertLeadModalProps = {
  open: boolean;
  lead: SuperAdminLead | null;
  busy?: boolean;
  onClose: () => void;
  onConvert: (data: ConvertLeadIn) => void;
};

export function ConvertLeadModal({
  open,
  lead,
  busy,
  onClose,
  onConvert,
}: ConvertLeadModalProps) {
  const [form, setForm] = useState<FormState>(seedFromLead(lead));
  const [subdomainTouched, setSubdomainTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(seedFromLead(lead));
      setSubdomainTouched(false);
    }
  }, [open, lead]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.workspace_name.trim() ||
      !form.site_name.trim() ||
      !form.subdomain.trim()
    ) {
      return;
    }
    onConvert({
      workspace_name: form.workspace_name.trim(),
      plan: form.plan,
      template_key: form.template_key,
      site_name: form.site_name.trim(),
      subdomain: form.subdomain.trim().toLowerCase(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Convert to customer"
      busy={busy}
      submitLabel="Convert"
      compact
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        {lead ? (
          <p className="text-sm text-muted">
            Creates a workspace for{" "}
            <span className="font-medium text-foreground">{lead.email}</span>.
            They keep the password they set at signup.
          </p>
        ) : null}
        <SettingsInput
          label="Workspace name"
          required
          value={form.workspace_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, workspace_name: e.target.value }))
          }
        />
        <SettingsSelect
          label="Plan"
          value={form.plan}
          options={PLAN_OPTIONS}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              plan: e.target.value as SuperAdminTenant["plan"],
            }))
          }
        />
        <SettingsSelect
          label="Template"
          value={form.template_key}
          options={TEMPLATE_OPTIONS}
          onChange={(e) =>
            setForm((f) => ({ ...f, template_key: e.target.value }))
          }
        />
        <SettingsInput
          label="Site name"
          required
          value={form.site_name}
          onChange={(e) => {
            const site_name = e.target.value;
            setForm((f) => ({
              ...f,
              site_name,
              subdomain: subdomainTouched ? f.subdomain : slugify(site_name),
            }));
          }}
        />
        <SettingsInput
          label="Subdomain"
          required
          hint="Letters, numbers, hyphens. Live after they publish."
          value={form.subdomain}
          onChange={(e) => {
            setSubdomainTouched(true);
            setForm((f) => ({ ...f, subdomain: e.target.value.toLowerCase() }));
          }}
        />
      </div>
    </FormModal>
  );
}
