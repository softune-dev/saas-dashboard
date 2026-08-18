"use client";

import { useEffect, useState } from "react";
import { updateMe } from "@/lib/api";
import { useSession } from "@/components/providers/session-provider";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import { SettingsInput } from "@/components/settings/site/ui/settings-field";
import { SettingsRowSkeleton } from "@/components/settings/site/ui/settings-skeleton";
import { useToast } from "@/components/ui/toast";

/** Phone/language/timezone aren't on the User model yet, so this form only
 * saves full_name for real. Email is shown but not editable here — changing
 * a login email needs a re-verification flow this doesn't have. */
export function AccountProfileForm() {
  const { me, loading, refetch } = useSession();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(me?.user.full_name ?? "");
  }, [me?.user.full_name]);

  if (loading) {
    return (
      <section className="rounded-md bg-white p-4 sm:p-5">
        <h2 className="mb-5 text-base font-semibold text-foreground">
          Profile details
        </h2>
        <SettingsRowSkeleton />
      </section>
    );
  }

  async function handleSave() {
    if (!me || busy) return;
    setBusy(true);
    try {
      await updateMe({ full_name: name.trim() });
      refetch();
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update profile",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md bg-white p-4 sm:p-5">
      <h2 className="mb-5 text-base font-semibold text-foreground">
        Profile details
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!me}
        />
        <SettingsInput
          label="Email"
          type="email"
          value={me?.user.email ?? ""}
          disabled
          hint="Contact support to change your login email."
          onChange={() => {}}
        />
      </div>

      <SettingsActions saveLabel={busy ? "Saving…" : "Save profile"} onSave={handleSave} />
    </section>
  );
}
