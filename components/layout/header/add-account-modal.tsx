"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { RecaptchaChallengeRequiredError } from "@/lib/api";
import { getRecaptchaToken, hasV2Fallback } from "@/lib/recaptcha";
import {
  addLinkedAccount,
  finishLinkedAccount,
} from "@/lib/linked-accounts";
import { LoginOtpForm } from "@/components/auth/login-otp-form";
import { RecaptchaDisclosure } from "@/components/auth/recaptcha-disclosure";
import {
  RecaptchaV2Fallback,
  type RecaptchaV2FallbackHandle,
} from "@/components/auth/recaptcha-v2-fallback";

type AddAccountModalProps = {
  open: boolean;
  onAdded: () => void;
  onDismiss: () => void;
};

/** Logs a SECOND account in for the switcher — never touches the currently
 * active session (see lib/linked-accounts.ts's addLinkedAccount). */
export function AddAccountModal({ open, onAdded, onDismiss }: AddAccountModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsChallenge, setNeedsChallenge] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const v2Ref = useRef<RecaptchaV2FallbackHandle>(null);

  function resetForm() {
    setEmail("");
    setPassword("");
    setLoginToken(null);
    setNeedsChallenge(false);
    setV2Token(null);
    setError(null);
  }

  useEffect(() => {
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the modal closes
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const result = await addLinkedAccount(
        email,
        password,
        recaptchaToken,
        v2Token ?? "",
      );
      if ("otp_required" in result && result.otp_required) {
        setLoginToken(result.login_token);
        return;
      }
      resetForm();
      onAdded();
    } catch (err) {
      if (err instanceof RecaptchaChallengeRequiredError) {
        setNeedsChallenge(true);
        setError(hasV2Fallback ? null : err.message);
      } else {
        setError(err instanceof Error ? err.message : "Couldn't add that account");
        v2Ref.current?.reset();
      }
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
            aria-labelledby="add-account-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-md bg-surface p-5"
          >
            <h3 id="add-account-title" className="text-base font-semibold text-foreground">
              {loginToken ? "Check your email" : "Add another account"}
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              {loginToken
                ? "Enter the 6-digit code we sent. It expires in 10 minutes."
                : "Sign in with a different store's login — you'll be able to switch between them instantly, no logout needed."}
            </p>

            {loginToken ? (
              <LoginOtpForm
                email={email}
                loginToken={loginToken}
                compact
                complete={finishLinkedAccount}
                onSuccess={() => {
                  resetForm();
                  onAdded();
                }}
                onBack={() => {
                  setLoginToken(null);
                  setError(null);
                }}
              />
            ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {needsChallenge && hasV2Fallback ? (
                <RecaptchaV2Fallback ref={v2Ref} onVerify={setV2Token} />
              ) : null}
              <button
                type="submit"
                disabled={busy || (needsChallenge && !v2Token)}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Adding..." : "Add account"}
              </button>
              <RecaptchaDisclosure />
            </form>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
