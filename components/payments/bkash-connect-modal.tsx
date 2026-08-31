"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type BkashConnectValues = {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  sandbox: boolean;
  label: string;
};

type BkashConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: BkashConnectValues) => void;
};

const empty: BkashConnectValues = {
  appKey: "",
  appSecret: "",
  username: "",
  password: "",
  sandbox: true,
  label: "",
};

/** Collects bKash Tokenized Checkout credentials. Parent POSTs them as
 * api_key/secret_key/username/password — never logged here. */
export function BkashConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: BkashConnectModalProps) {
  const [form, setForm] = useState<BkashConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.appKey.trim() ||
      !form.appSecret.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    )
      return;
    onConnect({
      appKey: form.appKey.trim(),
      appSecret: form.appSecret.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      sandbox: form.sandbox,
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect bKash"
      busy={busy}
      submitLabel={busy ? "Connecting…" : "Connect"}
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
          label="App Key"
          required
          value={form.appKey}
          onChange={(e) => setForm((f) => ({ ...f, appKey: e.target.value }))}
          placeholder="bKash app key"
          autoComplete="off"
        />
        <SettingsInput
          label="App Secret"
          required
          type="password"
          value={form.appSecret}
          onChange={(e) => setForm((f) => ({ ...f, appSecret: e.target.value }))}
          placeholder="bKash app secret"
          autoComplete="new-password"
        />
        <SettingsInput
          label="Username"
          required
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="bKash merchant username"
          autoComplete="off"
        />
        <SettingsInput
          label="Password"
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="bKash merchant password"
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
          placeholder="Main account"
        />
      </div>
    </FormModal>
  );
}
