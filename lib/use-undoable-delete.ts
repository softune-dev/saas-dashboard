"use client";

import { useRef } from "react";
import { useToast } from "@/components/ui/toast";

const UNDO_WINDOW_MS = 10_000;

type Pending = { timer: ReturnType<typeof setTimeout> };

/**
 * Gmail-style deferred delete: the row disappears immediately (optimistic),
 * but the real DELETE request doesn't fire until the toast's 10s countdown
 * finishes. Clicking Undo just cancels that timer and puts the row back —
 * no backend call ever happened, so there's nothing to reverse. Simpler and
 * safer than delete-then-recreate, which would mint a new id and lose
 * anything referencing the old one.
 */
export function useUndoableDelete() {
  const { toast } = useToast();
  const pending = useRef<Map<string, Pending>>(new Map());

  function deleteWithUndo<T>(options: {
    id: string;
    item: T;
    title: string;
    optimisticRemove: () => void;
    restore: (item: T) => void;
    commitDelete: () => Promise<void>;
    onError?: (err: unknown) => void;
  }) {
    const { id, item, title, optimisticRemove, restore, commitDelete, onError } = options;

    optimisticRemove();

    const timer = setTimeout(async () => {
      pending.current.delete(id);
      try {
        await commitDelete();
      } catch (err) {
        // The real delete failed after the undo window closed — put the row
        // back rather than leave the UI silently out of sync with the server.
        restore(item);
        onError?.(err);
      }
    }, UNDO_WINDOW_MS);
    pending.current.set(id, { timer });

    toast({
      title,
      variant: "success",
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          const p = pending.current.get(id);
          if (!p) return; // already committed or already undone
          clearTimeout(p.timer);
          pending.current.delete(id);
          restore(item);
        },
      },
    });
  }

  return { deleteWithUndo };
}
