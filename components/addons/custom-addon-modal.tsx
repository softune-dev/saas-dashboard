"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  SettingsInput,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";

export type CustomAddonRequest = {
  name: string;
  details: string;
};

type CustomAddonModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CustomAddonRequest) => void;
};

/** Short form for merchants who need an add-on that isn't in the catalog. */
export function CustomAddonModal({
  open,
  onClose,
  onSubmit,
}: CustomAddonModalProps) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDetails("");
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDetails = details.trim();
    if (!trimmedName || !trimmedDetails) return;
    onSubmit({ name: trimmedName, details: trimmedDetails });
  }

  return (
    <FormModal
      open={open}
      title="Request custom add-on"
      submitLabel="Send request"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <SettingsInput
          label="Add-on name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wholesale pricing"
          maxLength={80}
        />
        <SettingsTextarea
          label="What do you need?"
          required
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe the feature, who it's for, and any must-haves."
          className="min-h-[120px]"
          maxLength={1000}
        />
      </div>
    </FormModal>
  );
}
