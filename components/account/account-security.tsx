"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";
import { useToast } from "@/components/ui/toast";

const empty = { current: "", next: "", confirm: "" };

/** 2FA has no backend support yet — left as a disabled placeholder rather
 * than a button that does nothing. */
export function AccountSecurity() {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (busy) return;
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
      await changePassword({ current_password: form.current, new_password: form.next });
      setForm(empty);
      toast({ title: "Password updated", variant: "success" });
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
      <h2 className="mb-4 text-base font-semibold text-foreground">Security</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Current password"
          type="password"
          value={form.current}
          onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
          autoComplete="current-password"
        />
        <div className="hidden sm:block" />
        <SettingsInput
          label="New password"
          type="password"
          value={form.next}
          onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
          autoComplete="new-password"
        />
        <SettingsInput
          label="Confirm password"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          autoComplete="new-password"
        />
      </div>

      <div className="mt-4">
        <SettingsActions
          saveLabel={busy ? "Updating…" : "Update password"}
          onSave={handleSave}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border dark:border-transparent pt-6">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-sm text-muted">
            Add an extra layer of security to your account.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="shrink-0 inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted-soft transition-colors disabled:cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>
    </section>
  );
}
