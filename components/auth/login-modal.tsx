"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { login } from "@/lib/api";

type LoginModalProps = {
  open: boolean;
  /** Called after a successful login. */
  onSuccess: () => void;
  onDismiss: () => void;
};

export function LoginModal({ open, onSuccess, onDismiss }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={onDismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-md bg-white p-5"
          >
            <h3 id="login-title" className="text-base font-semibold text-foreground">
              Sign in to publish
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Publishing writes to the live site, so it needs your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-full border border-border bg-white px-4 text-sm outline-none focus:border-primary"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-full border border-border bg-white px-4 text-sm outline-none focus:border-primary"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
