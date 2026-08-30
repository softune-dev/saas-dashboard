"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type EcourierConnectValues = {
  username: string;
  password: string;
  label: string;
};

type EcourierConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: EcourierConnectValues) => void;
};

const empty: EcourierConnectValues = {
  username: "",
  password: "",
  label: "",
};

/** Collects eCourier merchant credentials and hands them to the parent,
 * which POSTs to /sites/{site_id}/couriers/ecourier. Unlike Steadfast/RedX/
 * Pathao, eCourier has no documented read-only endpoint to verify against —
 * these credentials are saved as entered and only proven right or wrong the
 * first time a real shipment goes through. */
export function EcourierConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: EcourierConnectModalProps) {
  const [form, setForm] = useState<EcourierConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return;
    onConnect({
      username: form.username.trim(),
      password: form.password.trim(),
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect eCourier"
      busy={busy}
      submitLabel="Connect"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}
        <p className="text-xs text-muted">
          eCourier doesn't offer a way to check credentials before use — these
          are saved as entered and confirmed only when a real shipment goes
          through.
        </p>
        <SettingsInput
          label="Merchant Username"
          required
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="Your eCourier merchant username"
          autoComplete="off"
        />
        <SettingsInput
          label="Merchant Password"
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Your eCourier merchant password"
          autoComplete="new-password"
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
