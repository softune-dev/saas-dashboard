"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type RedxConnectValues = {
  accessToken: string;
  baseUrl: string;
  label: string;
};

type RedxConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: RedxConnectValues) => void;
};

const empty: RedxConnectValues = {
  accessToken: "",
  baseUrl: "",
  label: "",
};

/** Collects a RedX merchant access token and hands it to the parent, which
 * POSTs to /sites/{site_id}/couriers/redx. */
export function RedxConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: RedxConnectModalProps) {
  const [form, setForm] = useState<RedxConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.accessToken.trim()) return;
    onConnect({
      accessToken: form.accessToken.trim(),
      baseUrl: form.baseUrl.trim(),
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect RedX"
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
          label="Access Token"
          required
          type="password"
          value={form.accessToken}
          onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
          placeholder="Your RedX merchant access token"
          autoComplete="new-password"
        />
        <SettingsInput
          label="Base URL"
          hint="Optional. Leave blank to use the default RedX API host."
          value={form.baseUrl}
          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          placeholder="https://openapi.redx.com.bd/v1.0.0-beta"
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
