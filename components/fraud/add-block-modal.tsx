"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { FormModal } from "@/components/ui/form-modal";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";

export type AddBlockValues = {
  phone: string;
  note: string;
};

type AddBlockModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (values: AddBlockValues) => void;
};

export function AddBlockModal({ open, onClose, onAdd }: AddBlockModalProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setPhone("");
      setNote("");
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned) return;
    onAdd({ phone: cleaned, note: note.trim() });
  }

  return (
    <FormModal
      open={open}
      title={t("Block a number")}
      submitLabel={t("Add")}
      headerBorder={false}
      compact
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <SettingsInput
          label={t("Phone number")}
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          autoComplete="off"
        />
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
