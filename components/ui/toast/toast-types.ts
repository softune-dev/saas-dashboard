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
};

export type ToastInput = Omit<ToastItem, "id">;
