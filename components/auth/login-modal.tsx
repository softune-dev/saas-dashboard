"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { RecaptchaChallengeRequiredError, login } from "@/lib/api";
import { getRecaptchaToken, hasV2Fallback } from "@/lib/recaptcha";
import { LoginOtpForm } from "./login-otp-form";
import { RecaptchaDisclosure } from "./recaptcha-disclosure";
import { RecaptchaV2Fallback, type RecaptchaV2FallbackHandle } from "./recaptcha-v2-fallback";

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
  const [needsChallenge, setNeedsChallenge] = useState(false);
  const [v2Token, setV2Token] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const v2Ref = useRef<RecaptchaV2FallbackHandle>(null);

  useEffect(() => {
    if (!open) setLoginToken(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const result = await login(email, password, true, recaptchaToken, v2Token ?? "");
      if (result.otp_required) {
        setLoginToken(result.login_token);
        return;
      }
      setPassword("");
      onSuccess();
    } catch (err) {
      if (err instanceof RecaptchaChallengeRequiredError) {
        setNeedsChallenge(true);
        setError(hasV2Fallback ? null : err.message);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
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
            aria-labelledby="login-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm rounded-md bg-surface p-5"
          >
            <h3 id="login-title" className="text-base font-semibold text-foreground">
              {loginToken ? "Check your email" : "Sign in to publish"}
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              {loginToken
                ? "Enter the 6-digit code we sent. It expires in 10 minutes."
                : "Publishing writes to the live site, so it needs your account."}
            </p>

            {loginToken ? (
              <LoginOtpForm
                email={email}
                loginToken={loginToken}
                compact
                onSuccess={() => {
                  setPassword("");
                  setLoginToken(null);
                  onSuccess();
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
                {busy ? "Signing in..." : "Sign in"}
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
