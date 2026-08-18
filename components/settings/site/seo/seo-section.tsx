"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { saveSiteSeo, useSiteSettingsSWR, type SiteSeo } from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
} from "../ui/settings-field";
import {
  SettingsRowSkeleton,
  SettingsTextareaSkeleton,
} from "../ui/settings-skeleton";

const emptyForm: SiteSeo = {
  title_suffix: "",
  meta_description: "",
  keywords: "",
  og_title: "",
  og_description: "",
  og_image: "",
  favicon: "",
  noindex: false,
  sitemap_enabled: true,
  google_analytics: "",
  google_search_console: "",
  facebook_pixel: "",
};

export function SeoSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [form, setForm] = useState<SiteSeo>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"og_image" | "favicon" | null>(null);

  // Hydrate the form once real data arrives — SWR may re-fetch in the
  // background, but this must not stomp on an in-progress edit.
  useEffect(() => {
    if (data) setForm({ ...emptyForm, ...data.seo });
  }, [data]);

  function setField<K extends keyof SiteSeo>(key: K, value: SiteSeo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(field: "og_image" | "favicon", file: File) {
    if (!siteId) return;
    setUploadingImage(field);
    try {
      const uploaded = await uploadSiteMedia(siteId, file, "other");
      setField(field, uploaded.url);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    try {
      const updated = await saveSiteSeo(siteId, form);
      await mutate({ ...data!, seo: updated.seo }, { revalidate: false });
      toast({ title: "SEO settings saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save SEO settings",
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
        <SettingsRowSkeleton cols={2} />
        <div className="border-t border-slate-100 pt-5">
          <SettingsRowSkeleton />
        </div>
        <SettingsTextareaSkeleton />
        <div className="border-t border-slate-100 pt-5">
          <SettingsRowSkeleton cols={3} />
        </div>
      </div>
    );
  }

  const previewTitle = data ? `${data.name}${form.title_suffix ? ` | ${form.title_suffix}` : ""}` : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Site title"
          value={data?.name ?? ""}
          disabled
          hint="Set from your site's name — edit that in Domains."
        />
        <SettingsInput
          label="Title suffix"
          value={form.title_suffix ?? ""}
          onChange={(e) => setField("title_suffix", e.target.value)}
          placeholder='Shown after every page title, e.g. "| Store Name"'
        />
      </div>

      <SettingsTextarea
        label="Meta description"
        value={form.meta_description ?? ""}
        onChange={(e) => setField("meta_description", e.target.value)}
        className="!min-h-[88px]"
      />

      <SettingsInput
        label="Keywords"
        value={form.keywords ?? ""}
        onChange={(e) => setField("keywords", e.target.value)}
        placeholder="comma, separated, keywords"
      />

      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <SettingsInput
          label="OG title"
          value={form.og_title ?? ""}
          onChange={(e) => setField("og_title", e.target.value)}
        />
        <ImageUploadField
          label="OG image"
          siteId={siteId}
          value={form.og_image ?? ""}
          uploading={uploadingImage === "og_image"}
          onUpload={(file) => handleUpload("og_image", file)}
          onPick={(url) => setField("og_image", url)}
          onClear={() => setField("og_image", "")}
        />
      </div>

      <SettingsTextarea
        label="OG description"
        value={form.og_description ?? ""}
        onChange={(e) => setField("og_description", e.target.value)}
        className="!min-h-[72px]"
      />

      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <SettingsSelect
          label="Indexing"
          value={form.noindex ? "noindex" : "index"}
          options={[
            { value: "index", label: "Allow" },
            { value: "noindex", label: "Hide" },
          ]}
          onChange={(e) => setField("noindex", e.target.value === "noindex")}
        />
        <SettingsSelect
          label="Sitemap"
          value={form.sitemap_enabled === false ? "no" : "yes"}
          options={[
            { value: "yes", label: "On" },
            { value: "no", label: "Off" },
          ]}
          onChange={(e) => setField("sitemap_enabled", e.target.value === "yes")}
        />
        <SettingsInput
          label="Google Analytics"
          value={form.google_analytics ?? ""}
          onChange={(e) => setField("google_analytics", e.target.value)}
          placeholder="G-XXXXXXXX"
        />
        <SettingsInput
          label="Search Console"
          value={form.google_search_console ?? ""}
          onChange={(e) => setField("google_search_console", e.target.value)}
          placeholder="Verification code"
        />
        <SettingsInput
          label="Facebook Pixel"
          value={form.facebook_pixel ?? ""}
          onChange={(e) => setField("facebook_pixel", e.target.value)}
          placeholder="Pixel ID"
        />
        <ImageUploadField
          label="Favicon"
          siteId={siteId}
          value={form.favicon ?? ""}
          uploading={uploadingImage === "favicon"}
          onUpload={(file) => handleUpload("favicon", file)}
          onPick={(url) => setField("favicon", url)}
          onClear={() => setField("favicon", "")}
        />
      </div>

      <div className="rounded-xl bg-search-bg p-4">
        <p className="truncate text-sm text-[#1a0dab]">{previewTitle}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
          {form.meta_description || "No meta description set yet."}
        </p>
      </div>

      <SettingsActions saveLabel={saving ? "Saving…" : "Save SEO"} onSave={handleSave} />
    </div>
  );
}

function ImageUploadField({
  label,
  siteId,
  value,
  uploading,
  onUpload,
  onPick,
  onClear,
}: {
  label: string;
  siteId: string | null;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onPick: (url: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="size-10 shrink-0 rounded-md border border-slate-200 bg-white object-contain p-1"
          />
        ) : null}
        <MediaSourceMenu
          siteId={siteId}
          category="other"
          onUploadFiles={(files) => {
            if (files[0]) onUpload(files[0]);
          }}
          onPickImages={(images: MediaImage[]) => {
            if (images[0]) onPick(images[0].url);
          }}
        >
          {(open) => (
            <button
              type="button"
              onClick={open}
              disabled={uploading}
              className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-search-bg text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : value ? "Replace image" : "Add image"}
            </button>
          )}
        </MediaSourceMenu>
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-muted-soft hover:text-red-500"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
