"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type CodConnectValues = {
  codFee: string;
};

type CodConnectModalProps = {
  open: boolean;
  busy?: boolean;
  initialFee?: string;
  onClose: () => void;
  onConnect: (values: CodConnectValues) => void;
};

export function CodConnectModal({
  open,
  busy,
  initialFee = "",
  onClose,
  onConnect,
}: CodConnectModalProps) {
  const [codFee, setCodFee] = useState(initialFee);

  useEffect(() => {
    if (open) setCodFee(initialFee);
  }, [open, initialFee]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConnect({ codFee: codFee.trim() });
  }

  return (
    <FormModal
      open={open}
      title="Cash on Delivery"
      busy={busy}
      submitLabel={busy ? "Saving…" : "Save"}
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <SettingsInput
        label="COD fee note"
        value={codFee}
        onChange={(e) => setCodFee(e.target.value)}
        placeholder="Optional — e.g. ৳50"
      />
    </FormModal>
  );
}
