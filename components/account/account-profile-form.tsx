"use client";

import { useEffect, useState } from "react";
import { updateMe } from "@/lib/api";
import { useSession } from "@/components/providers/session-provider";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import { SettingsInput, SettingsSelect } from "@/components/settings/site/ui/settings-field";
import { SettingsRowSkeleton } from "@/components/settings/site/ui/settings-skeleton";
import { useToast } from "@/components/ui/toast";

// Personal account timezone — distinct from Site Settings' business info.
// Used to render order timestamps and notification digests in the
// merchant's own local time instead of raw UTC. Bangladesh first since
// that's this platform's primary market, then other common zones.
const TIMEZONE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Asia/Dhaka", label: "Dhaka (GMT+6)" },
  { value: "Asia/Kolkata", label: "Kolkata (GMT+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Europe/London", label: "London (GMT+0/+1)" },
  { value: "America/New_York", label: "New York (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
];

/** full_name, phone, and timezone are all real, saved fields on the User
 * model. Email is shown but not editable here — changing a login email
 * needs a re-verification flow this doesn't have. */
export function AccountProfileForm() {
  const { me, loading, refetch } = useSession();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(me?.user.full_name ?? "");
    setPhone(me?.user.phone ?? "");
    setTimezone(me?.user.timezone ?? "");
  }, [me?.user.full_name, me?.user.phone, me?.user.timezone]);

  if (loading) {
    return (
      <section className="rounded-md bg-surface p-4 sm:p-5">
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
      await updateMe({
        full_name: name.trim(),
        phone: phone.trim(),
        timezone,
      });
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
    <section className="rounded-md bg-surface p-4 sm:p-5">
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
        <SettingsInput
          label="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!me}
          placeholder="+8801XXXXXXXXX"
        />
        <SettingsSelect
          label="Timezone"
          value={timezone}
          options={TIMEZONE_OPTIONS}
          onChange={(e) => setTimezone(e.target.value)}
          disabled={!me}
        />
      </div>

      <SettingsActions saveLabel={busy ? "Saving…" : "Save profile"} onSave={handleSave} />
    </section>
  );
}
