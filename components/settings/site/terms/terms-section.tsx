"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import { saveSiteLegal, useSiteSettingsSWR } from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsInput, SettingsTextarea } from "../ui/settings-field";
import { SettingsEditorSkeleton, SettingsFieldSkeleton } from "../ui/settings-skeleton";

export function TermsSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [title, setTitle] = useState("Terms of Service");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.legal.terms) {
      setTitle(data.legal.terms.title);
      setContent(data.legal.terms.content);
      setPublished(data.legal.terms.published);
    }
  }, [data]);

  async function handleSave() {
    if (!siteId || !data) return;
    setSaving(true);
    try {
      const updated = await saveSiteLegal(siteId, {
        ...data.legal,
        terms: { title, content, published },
      });
      await mutate({ ...data, legal: updated.legal }, { revalidate: false });
      toast({ title: t("Terms saved"), variant: "success" });
    } catch (err) {
      toast({
        title: t("Couldn't save terms"),
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
      <SettingsInput label={t("Page title")} value={title} onChange={(e) => setTitle(e.target.value)} />

      <SettingsTextarea
        label={t("Terms content")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your terms of service…"
        className="!min-h-[280px]"
      />

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 rounded border-slate-300 accent-primary"
        />
        {t("Published on storefront")}
      </label>

      <SettingsActions saveLabel={saving ? "Saving…" : t("Save terms")} onSave={handleSave} />
    </div>
  );
}
