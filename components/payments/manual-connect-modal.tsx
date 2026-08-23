"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type ManualWalletId = "bkash" | "nagad";

export type ManualConnectValues = {
  paymentNumber: string;
  wallets: ManualWalletId[];
};

type ManualConnectModalProps = {
  open: boolean;
  busy?: boolean;
  initialNumber?: string;
  initialWallets?: ManualWalletId[];
  onClose: () => void;
  onConnect: (values: ManualConnectValues) => void;
};

const WALLET_OPTIONS: {
  id: ManualWalletId;
  label: string;
  logoSrc: string;
}[] = [
  { id: "bkash", label: "bKash", logoSrc: "/payments/bkash.webp" },
  { id: "nagad", label: "Nagad", logoSrc: "/payments/nagad.webp" },
];

export function ManualConnectModal({
  open,
  busy,
  initialNumber = "",
  initialWallets = ["bkash"],
  onClose,
  onConnect,
}: ManualConnectModalProps) {
  const [paymentNumber, setPaymentNumber] = useState(initialNumber);
  const [wallets, setWallets] = useState<ManualWalletId[]>(initialWallets);

  useEffect(() => {
    if (!open) return;
    setPaymentNumber(initialNumber);
    const cleaned = (initialWallets ?? []).filter(
      (w): w is ManualWalletId => w === "bkash" || w === "nagad",
    );
    setWallets(cleaned.length > 0 ? cleaned : ["bkash"]);
    // Only reseed when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleWallet(id: ManualWalletId) {
    setWallets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentNumber.trim() || wallets.length === 0) return;
    onConnect({
      paymentNumber: paymentNumber.trim(),
      wallets,
    });
  }

  return (
    <FormModal
      open={open}
      title="Manual Payment"
      busy={busy}
      submitLabel={busy ? "Saving…" : "Save"}
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <SettingsInput
          label="Payment number"
          required
          value={paymentNumber}
          onChange={(e) => setPaymentNumber(e.target.value)}
          placeholder="01XXXXXXXXX"
          autoComplete="off"
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium text-muted">Wallets</legend>
          <div className="flex flex-wrap gap-2">
            {WALLET_OPTIONS.map((opt) => {
              const on = wallets.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleWallet(opt.id)}
                  aria-pressed={on}
                  aria-label={opt.label}
                  title={opt.label}
                  className={[
                    "flex h-12 w-[7.5rem] items-center justify-center rounded-xl border transition-colors",
                    on
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-search-bg hover:border-slate-300",
                  ].join(" ")}
                >
                  <img
                    src={opt.logoSrc}
                    alt={opt.label}
                    className="max-h-8 max-w-[6.5rem] object-contain"
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </FormModal>
  );
}
