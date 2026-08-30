"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type PathaoConnectValues = {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  baseUrl: string;
  label: string;
};

type PathaoConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: PathaoConnectValues) => void;
};

const empty: PathaoConnectValues = {
  clientId: "",
  clientSecret: "",
  username: "",
  password: "",
  baseUrl: "",
  label: "",
};

/** Collects Pathao merchant credentials and hands them to the parent, which
 * POSTs to /sites/{site_id}/couriers/pathao. Four fields, not two — Pathao's
 * password-grant OAuth needs client_id + client_secret + username + password,
 * unlike Steadfast/RedX's single key(s). */
export function PathaoConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: PathaoConnectModalProps) {
  const [form, setForm] = useState<PathaoConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.clientId.trim() ||
      !form.clientSecret.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    )
      return;
    onConnect({
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      baseUrl: form.baseUrl.trim(),
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect Pathao"
      busy={busy}
      submitLabel="Connect"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}
        <SettingsInput
          label="Client ID"
          required
          value={form.clientId}
          onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          placeholder="Your Pathao client ID"
          autoComplete="off"
        />
        <SettingsInput
          label="Client Secret"
          required
          type="password"
          value={form.clientSecret}
          onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
          placeholder="Your Pathao client secret"
          autoComplete="new-password"
        />
        <SettingsInput
          label="Merchant Username"
          required
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="Your Pathao merchant email"
          autoComplete="off"
        />
        <SettingsInput
          label="Merchant Password"
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Your Pathao merchant password"
          autoComplete="new-password"
        />
        <SettingsInput
          label="Base URL"
          hint="Optional. Leave blank to use the default Pathao API host."
          value={form.baseUrl}
          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          placeholder="https://api-hermes.pathao.com"
        />
        <SettingsInput
          label="Label"
          hint="Optional name for this connection (e.g. Main warehouse)."
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="Main account"
        />
      </div>
    </FormModal>
  );
}
