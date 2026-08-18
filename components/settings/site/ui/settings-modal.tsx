"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type SettingsModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function SettingsModal({
  open,
  title,
  onClose,
  children,
}: SettingsModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="relative z-10 w-full max-w-md rounded-md bg-white p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3
            id="settings-modal-title"
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}
