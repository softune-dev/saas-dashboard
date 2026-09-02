"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToastInput, ToastItem } from "./toast-types";
import { ToastViewport } from "./toast-viewport";

type ToastContextValue = {
  /** Returns the new toast's id — callers driving a progress bar (file
   * uploads) need it back to call update() as the work proceeds. */
  toast: (input: ToastInput) => string;
  update: (id: string, patch: Partial<ToastInput>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Upload toasts (progress !== undefined, still < 100) are exempt from this —
// several files uploading at once must all stay visible, not get silently
// dropped because a normal toast pushed them out. Everything else still
// caps at 4 so a burst of unrelated toasts can't pile up forever.
const MAX_TOASTS = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: ToastItem = {
      id,
      variant: "success",
      duration: 3200,
      ...input,
    };
    setItems((list) => {
      const next = [...list, item];
      const inFlight = next.filter(
        (t) => t.progress !== undefined && t.progress < 100,
      );
      const rest = next.filter((t) => !inFlight.includes(t));
      return [...rest.slice(-Math.max(0, MAX_TOASTS - inFlight.length)), ...inFlight];
    });
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<ToastInput>) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const value = useMemo(() => ({ toast, update, dismiss }), [toast, update, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
