"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers/language-provider";
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
  const { t } = useLanguage();
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
      title={t("Block an IP address")}
      submitLabel={t("Add")}
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <SettingsInput
          label={t("IP address")}
          required
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="203.0.113.5"
          autoComplete="off"
        />
        <p className="-mt-1 text-xs text-muted">
          {t("Exact address only — ranges (CIDR) aren't supported.")}
        </p>
        <SettingsInput
          label={t("Note")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("Optional — why blocked")}
        />
      </div>
    </FormModal>
  );
}
