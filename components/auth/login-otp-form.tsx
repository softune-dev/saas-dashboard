"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  exchangeLoginOtp,
  setTokens,
  type LoginTokens,
} from "@/lib/api";
import { OTP_LENGTH, OtpBoxes, emptyOtpDigits } from "./otp-boxes";

type LoginOtpFormProps = {
  email?: string;
  loginToken: string;
  /** Session persist flag (localStorage vs sessionStorage), not device trust. */
  remember?: boolean;
  /** Linked-account path: store tokens on the switcher, never the active session. */
  complete?: (tokens: LoginTokens) => Promise<unknown>;
  onSuccess: () => void;
  onBack: () => void;
  compact?: boolean;
};

export function LoginOtpForm({
  email,
  loginToken,
  remember = true,
  complete,
  onSuccess,
  onBack,
  compact,
}: LoginOtpFormProps) {
  const [digits, setDigits] = useState<string[]>(emptyOtpDigits);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const otp = digits.join("");

  async function submitCode(code: string) {
    if (code.length !== OTP_LENGTH || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setBusy(true);
    try {
      const tokens = await exchangeLoginOtp(loginToken, code);
      if (complete) await complete(tokens);
      else setTokens(tokens.access_token, tokens.refresh_token, remember);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify code");
      setDigits(emptyOtpDigits());
      setBusy(false);
      submittingRef.current = false;
    }
  }

  function handleDigits(next: string[]) {
    setDigits(next);
    if (next.join("").length === OTP_LENGTH) void submitCode(next.join(""));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submitCode(otp);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "mt-4 flex flex-col gap-4" : "mt-8 flex flex-col gap-4"}
    >
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-foreground">
          Verification code
        </span>
        <OtpBoxes value={digits} onChange={handleDigits} disabled={busy} />
        {email ? (
          <p className="text-xs text-muted">
            Sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy || otp.length !== OTP_LENGTH}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {busy ? (
          <>
            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </button>

      <p className="text-center text-sm text-muted">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="font-medium text-primary hover:underline disabled:opacity-50"
        >
          Sign in again
        </button>
      </p>
    </form>
  );
}
