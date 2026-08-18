"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { saveSiteLegal, useSiteSettingsSWR } from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsInput, SettingsTextarea } from "../ui/settings-field";
import { SettingsEditorSkeleton, SettingsFieldSkeleton } from "../ui/settings-skeleton";

export function PrivacySection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [title, setTitle] = useState("Privacy Policy");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.legal.privacy) {
      setTitle(data.legal.privacy.title);
      setContent(data.legal.privacy.content);
      setPublished(data.legal.privacy.published);
    }
  }, [data]);

  async function handleSave() {
    if (!siteId || !data) return;
    setSaving(true);
    try {
      const updated = await saveSiteLegal(siteId, {
        ...data.legal,
        privacy: { title, content, published },
      });
      await mutate({ ...data, legal: updated.legal }, { revalidate: false });
      toast({ title: "Privacy policy saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save privacy policy",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <SettingsFieldSkeleton short />
        <SettingsEditorSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SettingsInput label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />

      <SettingsTextarea
        label="Policy content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your privacy policy…"
        className="!min-h-[280px]"
      />

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 rounded border-slate-300 accent-primary"
        />
        Published on storefront
      </label>

      <SettingsActions
        saveLabel={saving ? "Saving…" : "Save privacy policy"}
        onSave={handleSave}
      />
    </div>
  );
}
