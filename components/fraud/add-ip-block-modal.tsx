"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type AddIpBlockValues = {
  ip_address: string;
  note: string;
};

type AddIpBlockModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (values: AddIpBlockValues) => void;
};

export function AddIpBlockModal({ open, onClose, onAdd }: AddIpBlockModalProps) {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setIp("");
      setNote("");
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = ip.trim();
    if (!cleaned) return;
    onAdd({ ip_address: cleaned, note: note.trim() });
  }

  return (
    <FormModal
      open={open}
      title="Block an IP address"
      submitLabel="Add"
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <SettingsInput
          label="IP address"
          required
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="203.0.113.5"
          autoComplete="off"
        />
        <p className="-mt-1 text-xs text-muted">
          Exact address only — ranges (CIDR) aren't supported.
        </p>
        <SettingsInput
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — why blocked"
        />
      </div>
    </FormModal>
  );
}
