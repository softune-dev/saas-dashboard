"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type SslcommerzConnectValues = {
  storeId: string;
  storePassword: string;
  sandbox: boolean;
  label: string;
};

type SslcommerzConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: SslcommerzConnectValues) => void;
};

const empty: SslcommerzConnectValues = {
  storeId: "",
  storePassword: "",
  sandbox: true,
  label: "",
};

/** Collects SSLCommerz store credentials. Parent maps Store ID → api_key
 * and Store Password → secret_key. Saved unverified — SSLCommerz has no
 * standalone credential check that isn't also a real session. */
export function SslcommerzConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: SslcommerzConnectModalProps) {
  const [form, setForm] = useState<SslcommerzConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.storeId.trim() || !form.storePassword.trim()) return;
    onConnect({
      storeId: form.storeId.trim(),
      storePassword: form.storePassword.trim(),
      sandbox: form.sandbox,
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect SSLCommerz"
      busy={busy}
      submitLabel={busy ? "Saving…" : "Save"}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <SettingsInput
          label="Store ID"
          required
          value={form.storeId}
          onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
          placeholder="SSLCommerz store ID"
          autoComplete="off"
        />
        <SettingsInput
          label="Store Password"
          required
          type="password"
          value={form.storePassword}
          onChange={(e) =>
            setForm((f) => ({ ...f, storePassword: e.target.value }))
          }
          placeholder="SSLCommerz store password"
          autoComplete="new-password"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.sandbox}
            onChange={(e) =>
              setForm((f) => ({ ...f, sandbox: e.target.checked }))
            }
            className="size-4 rounded border-slate-300 accent-primary"
          />
          Sandbox
        </label>
        <p className="-mt-2 text-xs text-muted">
          Leave on until you are ready for live payments.
        </p>
        <SettingsInput
          label="Label"
          hint="Optional name for this connection."
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="Main store"
        />
      </div>
    </FormModal>
  );
}
