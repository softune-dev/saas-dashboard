"use client";

import { useState } from "react";
import { confirmChangePassword, requestChangePasswordOtp } from "@/lib/api";
import { useLanguage } from "@/components/providers/language-provider";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";
import { FormModal } from "@/components/ui/form-modal";
import { OtpBoxes, emptyOtpDigits, OTP_LENGTH } from "@/components/auth/otp-boxes";
import { useToast } from "@/components/ui/toast";

const empty = { current: "", next: "", confirm: "" };

/** Changing your password requires a code emailed to you first — same
 * OTP mechanism as login, just gated on a different pair of DB columns
 * (see migrations/052) so an in-progress login OTP challenge is never
 * affected. 2FA has no backend support yet — left as a disabled
 * placeholder rather than a button that does nothing. */
export function AccountSecurity() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState(empty);
  const [otp, setOtp] = useState(emptyOtpDigits());
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("form");
    setForm(empty);
    setOtp(emptyOtpDigits());
  }

  function close() {
    if (busy) return;
    setOpen(false);
    reset();
  }

  async function handleRequestOtp() {
    if (!form.current || !form.next) {
      toast({ title: "Fill in both password fields", variant: "info" });
      return;
    }
    if (form.next !== form.confirm) {
      toast({ title: "New passwords don't match", variant: "info" });
      return;
    }
    setBusy(true);
    try {
      await requestChangePasswordOtp(form.current);
      setStep("otp");
      toast({ title: "Code sent to your email", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't send code",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast({ title: "Enter the 6-digit code", variant: "info" });
      return;
    }
    setBusy(true);
    try {
      await confirmChangePassword(code, form.next);
      toast({ title: "Password updated", variant: "success" });
      setOpen(false);
      reset();
    } catch (err) {
      toast({
        title: "Couldn't update password",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">{t("Security")}</h2>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground">{t("Password")}</h3>
          <p className="text-sm text-muted">
            {t("A code emailed to you is required to change it.")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-search-bg"
        >
          {t("Change password")}
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border dark:border-transparent pt-6">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            {t("Two-Factor Authentication (2FA)")}
          </h3>
          <p className="text-sm text-muted">
            {t("Add an extra layer of security to your account.")}
          </p>
        </div>
        <button
          type="button"
          disabled
          title={t("Coming soon")}
          className="shrink-0 inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted-soft transition-colors disabled:cursor-not-allowed"
        >
          {t("Coming soon")}
        </button>
      </div>

      <FormModal
        open={open}
        title={step === "form" ? t("Change password") : t("Enter the code")}
        busy={busy}
        submitLabel={
          step === "form"
            ? busy
              ? "Sending code…"
              : t("Send code")
            : busy
              ? "Updating…"
              : t("Update password")
        }
        onClose={close}
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "form") void handleRequestOtp();
          else void handleConfirm();
        }}
      >
        {step === "form" ? (
          <div className="flex flex-col gap-4">
            <SettingsInput
              label={t("Current password")}
              type="password"
              value={form.current}
              onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
            />
            <SettingsInput
              label={t("New password")}
              type="password"
              value={form.next}
              onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
              autoComplete="new-password"
            />
            <SettingsInput
              label={t("Confirm password")}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm text-muted">
              Enter the 6-digit code we emailed you to confirm the change.
            </p>
            <OtpBoxes value={otp} onChange={setOtp} disabled={busy} />
          </div>
        )}
      </FormModal>
    </section>
  );
}
