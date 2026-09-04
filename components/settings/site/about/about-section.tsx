"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { saveSiteAbout, useSiteSettingsSWR, type SiteAbout } from "@/lib/api/site-settings";
import { AiGenerateButton } from "@/components/ui/ai-generate-button";
import { generateAiText } from "@/lib/api/ai";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsInput, SettingsTextarea } from "../ui/settings-field";
import { SettingsRowSkeleton, SettingsTextareaSkeleton } from "../ui/settings-skeleton";

const emptyForm: SiteAbout = { heading: "", image: "", paragraphs: [] };

export function AboutSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [form, setForm] = useState<SiteAbout>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...emptyForm, ...data.about });
  }, [data]);

  function setField<K extends keyof SiteAbout>(key: K, value: SiteAbout[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addParagraph() {
    setForm((prev) => ({ ...prev, paragraphs: [...(prev.paragraphs ?? []), ""] }));
  }

  function updateParagraph(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      paragraphs: (prev.paragraphs ?? []).map((p, i) => (i === index ? value : p)),
    }));
  }

  function removeParagraph(index: number) {
    setForm((prev) => ({
      ...prev,
      paragraphs: (prev.paragraphs ?? []).filter((_, i) => i !== index),
    }));
  }

  async function handleUpload(file: File) {
    if (!siteId) return;
    setUploading(true);
    try {
      const uploaded = await uploadSiteMedia(siteId, file, "other");
      setField("image", uploaded.url);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    try {
      const cleaned: SiteAbout = {
        ...form,
        paragraphs: (form.paragraphs ?? []).map((p) => p.trim()).filter(Boolean),
      };
      const updated = await saveSiteAbout(siteId, cleaned);
      setForm({ ...emptyForm, ...updated.about });
      await mutate({ ...data!, about: updated.about }, { revalidate: false });
      toast({ title: t("About page saved"), variant: "success" });
    } catch (err) {
      toast({
        title: t("Couldn't save the About page"),
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
        <SettingsRowSkeleton />
        <SettingsTextareaSkeleton />
        <SettingsTextareaSkeleton />
      </div>
    );
  }

  const paragraphs = form.paragraphs ?? [];

  return (
    <div className="flex flex-col gap-5">
      <SettingsInput
        label={t("Heading")}
        value={form.heading ?? ""}
        onChange={(e) => setField("heading", e.target.value)}
        placeholder="e.g. Where heritage meets contemporary form"
      />

      <div className="flex items-start gap-4">
        {form.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.image}
            alt=""
            className="size-28 shrink-0 rounded-md border border-border bg-surface object-cover shadow-sm"
          />
        ) : (
          <div className="flex size-28 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-search-bg text-xs font-medium text-muted-soft">
            Empty
          </div>
        )}

        <div className="flex flex-col gap-3 py-1">
          <span className="text-base font-semibold text-foreground">{t("About image")}</span>
          <div className="flex flex-wrap items-center gap-2">
            <MediaSourceMenu
              siteId={siteId}
              category="other"
              onUploadFiles={(files) => {
                if (files[0]) handleUpload(files[0]);
              }}
              onPickImages={(images: MediaImage[]) => {
                if (images[0]) setField("image", images[0].url);
              }}
            >
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  disabled={uploading}
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-search-bg px-4 text-xs font-medium text-muted transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : form.image ? t("Replace image") : t("Add image")}
                </button>
              )}
            </MediaSourceMenu>
            {form.image ? (
              <button
                type="button"
                onClick={() => setField("image", "")}
                aria-label="Remove image"
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border dark:border-transparent pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">{t("Story paragraphs")}</p>
          <PrimaryButton
            type="button"
            onClick={addParagraph}
            className="!h-9 !px-3 text-xs"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            {t("Add paragraph")}
          </PrimaryButton>
        </div>

        <ul className="flex flex-col gap-3">
          {paragraphs.map((paragraph, index) => (
            <li key={index} className="flex flex-col gap-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-soft uppercase">
                  {t("Paragraph")} {index + 1}
                </span>
                <button
                  type="button"
                  aria-label={`Remove paragraph ${index + 1}`}
                  onClick={() => removeParagraph(index)}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-red-500"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
                </button>
              </div>
              <SettingsTextarea
                label=""
                value={paragraph}
                onChange={(e) => updateParagraph(index, e.target.value)}
                placeholder="Tell your store's story…"
                className="!min-h-[100px]"
                labelExtra={
                  <AiGenerateButton
                    hasContext={!!currentSite?.name}
                    hasContent={!!paragraph.trim()}
                    onGenerate={async () => {
                      const text = await generateAiText(
                        "site_about_paragraph",
                        {
                          site_name: currentSite?.name,
                          heading: form.heading,
                          other_paragraphs: paragraphs.filter((_, i) => i !== index),
                        },
                        paragraph,
                      );
                      updateParagraph(index, text);
                    }}
                  />
                }
              />
            </li>
          ))}
        </ul>

        {paragraphs.length === 0 ? (
          <p className="rounded-md bg-search-bg px-4 py-8 text-center text-sm text-muted">
            No paragraphs yet. Click "Add paragraph" to start your story.
          </p>
        ) : null}
      </div>

      <SettingsActions saveLabel={saving ? "Saving…" : t("Save About page")} onSave={handleSave} />
    </div>
  );
}
