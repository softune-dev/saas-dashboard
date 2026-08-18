"use client";

import { AnimatePresence } from "motion/react";
import { ToastItemView } from "./toast-item";
import type { ToastItem } from "./toast-types";

type ToastViewportProps = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ items, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2.5 p-4 sm:p-6"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastItemView key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
