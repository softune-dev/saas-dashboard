"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";
import type { PaymentProvider } from "./payment-data";

export type GatewayConnectValues = {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  label: string;
};

type GatewayConnectModalProps = {
  open: boolean;
  provider: PaymentProvider | null;
  providerName?: string;
  comingSoon?: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnect: (values: GatewayConnectValues) => void;
};

const empty: GatewayConnectValues = {
  apiKey: "",
  secretKey: "",
  merchantId: "",
  label: "",
};

export function GatewayConnectModal({
  open,
  provider,
  providerName = "gateway",
  comingSoon,
  busy,
  error,
  onClose,
  onConnect,
}: GatewayConnectModalProps) {
  const [form, setForm] = useState<GatewayConnectValues>(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open, provider]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (comingSoon) return;
    if (!form.apiKey.trim() || !form.secretKey.trim()) return;
    onConnect({
      apiKey: form.apiKey.trim(),
      secretKey: form.secretKey.trim(),
      merchantId: form.merchantId.trim(),
      label: form.label.trim(),
    });
  }

  return (
    <FormModal
      open={open}
      title={`Connect ${providerName}`}
      busy={busy || comingSoon}
      submitLabel={
        comingSoon ? "Coming soon" : busy ? "Connecting…" : "Connect"
      }
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <SettingsInput
          label="API Key"
          required
          value={form.apiKey}
          onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
          placeholder="API key"
          autoComplete="off"
          disabled={comingSoon}
        />
        <SettingsInput
          label="Secret Key"
          required
          type="password"
          value={form.secretKey}
          onChange={(e) =>
            setForm((f) => ({ ...f, secretKey: e.target.value }))
          }
          placeholder="Secret key"
          autoComplete="new-password"
          disabled={comingSoon}
        />
        <SettingsInput
          label="Merchant / Store ID"
          value={form.merchantId}
          onChange={(e) =>
            setForm((f) => ({ ...f, merchantId: e.target.value }))
          }
          placeholder="Optional"
          disabled={comingSoon}
        />
        <SettingsInput
          label="Label"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="Optional"
          disabled={comingSoon}
        />
      </div>
    </FormModal>
  );
}
