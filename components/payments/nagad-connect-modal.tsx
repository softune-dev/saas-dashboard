"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";

export type NagadConnectValues = {
  merchantId: string;
  merchantPrivateKey: string;
  nagadPublicKey: string;
  sandbox: boolean;
  label: string;
};

type NagadConnectModalProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: NagadConnectValues) => void;
};

const empty: NagadConnectValues = {
  merchantId: "",
  merchantPrivateKey: "",
  nagadPublicKey: "",
  sandbox: true,
  label: "",
};

/** Collects Nagad merchant RSA credentials. PEM blocks need a textarea —
 * a single-line password input would strip the newlines the API requires.
 * Parent POSTs merchant_id / merchant_private_key / nagad_public_key. */
export function NagadConnectModal({
  open,
  busy,
  error,
  onClose,
  onConnect,
}: NagadConnectModalProps) {
  const [form, setForm] = useState<NagadConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.merchantId.trim() ||
      !form.merchantPrivateKey.trim() ||
      !form.nagadPublicKey.trim()
    )
      return;
    onConnect({
      merchantId: form.merchantId.trim(),
      merchantPrivateKey: form.merchantPrivateKey.trim(),
      nagadPublicKey: form.nagadPublicKey.trim(),
      sandbox: form.sandbox,
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title="Connect Nagad"
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
          label="Merchant ID"
          required
          value={form.merchantId}
          onChange={(e) =>
            setForm((f) => ({ ...f, merchantId: e.target.value }))
          }
          placeholder="Nagad merchant ID"
          autoComplete="off"
        />
        <SettingsTextarea
          label="Merchant Private Key"
          required
          value={form.merchantPrivateKey}
          onChange={(e) =>
            setForm((f) => ({ ...f, merchantPrivateKey: e.target.value }))
          }
          placeholder={"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----"}
          autoComplete="off"
          spellCheck={false}
          className="!min-h-[120px] font-mono text-xs"
        />
        <SettingsTextarea
          label="Nagad Public Key"
          required
          value={form.nagadPublicKey}
          onChange={(e) =>
            setForm((f) => ({ ...f, nagadPublicKey: e.target.value }))
          }
          placeholder={"-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"}
          autoComplete="off"
          spellCheck={false}
          className="!min-h-[120px] font-mono text-xs"
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
