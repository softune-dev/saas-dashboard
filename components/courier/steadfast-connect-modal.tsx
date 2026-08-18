"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type SteadfastConnectValues = {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  label: string;
};

type SteadfastConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: SteadfastConnectValues) => void;
};

const empty: SteadfastConnectValues = {
  apiKey: "",
  secretKey: "",
  baseUrl: "",
  label: "",
};

/** Collects Steadfast merchant credentials and hands them to the parent,
 * which POSTs to /sites/{site_id}/couriers/steadfast. */
export function SteadfastConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: SteadfastConnectModalProps) {
  const [form, setForm] = useState<SteadfastConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.apiKey.trim() || !form.secretKey.trim()) return;
    onConnect({
      apiKey: form.apiKey.trim(),
      secretKey: form.secretKey.trim(),
      baseUrl: form.baseUrl.trim(),
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect Steadfast"
      busy={busy}
      submitLabel="Connect"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}
        <SettingsInput
          label="API Key"
          required
          value={form.apiKey}
          onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
          placeholder="Your Steadfast API key"
          autoComplete="off"
        />
        <SettingsInput
          label="Secret Key"
          required
          type="password"
          value={form.secretKey}
          onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
          placeholder="Your Steadfast secret key"
          autoComplete="new-password"
        />
        <SettingsInput
          label="Base URL"
          hint="Optional. Leave blank to use the default Steadfast API host."
          value={form.baseUrl}
          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          placeholder="https://portal.packzy.com/api/v1"
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
