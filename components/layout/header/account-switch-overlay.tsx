"use client";

import { motion, AnimatePresence } from "motion/react";

/** Full-page cover shown while switching accounts — a hard reload follows
 * right after (see store-pill.tsx), which is deliberate: it's the only way
 * to guarantee no state from the old tenant lingers in memory. This is
 * purely the "something's happening" cover for that reload. */
export function AccountSwitchOverlay({ label }: { label: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="size-9 rounded-full border-2 border-border border-t-primary"
        />
        <p className="text-sm font-medium text-muted">{label}</p>
      </motion.div>
    </AnimatePresence>
  );
}
