export type ToastVariant = "success" | "error" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  /** e.g. "Undo" on a delete toast — separate from the always-present X
   * dismiss button, and does NOT stop the countdown on its own; the caller's
   * onClick is responsible for that (see useUndoableDelete). */
  action?: ToastAction;
  /** 0-100 — presence of this field (not its value) is what puts the toast
   * in "upload" mode: it shows a progress bar instead of the countdown
   * border, and the auto-dismiss timer only starts once progress reaches
   * 100 (see toast-item.tsx). Set to 100 (or clear the field via update())
   * once the real work is done so it can dismiss like any other toast. */
  progress?: number;
};

export type ToastInput = Omit<ToastItem, "id">;
