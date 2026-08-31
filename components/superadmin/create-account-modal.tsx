"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import type { CreateAccountIn, SuperAdminTenant } from "@/lib/api/superadmin";

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
  email: string;
  password: string;
  workspace_name: string;
  full_name: string;
  plan: SuperAdminTenant["plan"];
  template_key: string;
  site_name: string;
  subdomain: string;
};

const empty: FormState = {
  email: "",
  password: "",
  workspace_name: "",
  full_name: "",
  plan: "starter",
  template_key: "aurora",
  site_name: "",
  subdomain: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

type CreateAccountModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onCreate: (data: CreateAccountIn) => void;
};

export function CreateAccountModal({
  open,
  busy,
  onClose,
  onCreate,
}: CreateAccountModalProps) {
  const [form, setForm] = useState<FormState>(empty);
  const [subdomainTouched, setSubdomainTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setSubdomainTouched(false);
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.email.trim() ||
      form.password.length < 8 ||
      !form.workspace_name.trim() ||
      !form.site_name.trim() ||
      !form.subdomain.trim()
    ) {
      return;
    }
    const payload: CreateAccountIn = {
      email: form.email.trim(),
      password: form.password,
      workspace_name: form.workspace_name.trim(),
      plan: form.plan,
      template_key: form.template_key,
      site_name: form.site_name.trim(),
      subdomain: form.subdomain.trim().toLowerCase(),
    };
    if (form.full_name.trim()) payload.full_name = form.full_name.trim();
    onCreate(payload);
  }

  return (
    <FormModal
      open={open}
      title="Create account"
      busy={busy}
      submitLabel="Create"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <SettingsInput
          label="Owner email"
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
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
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
