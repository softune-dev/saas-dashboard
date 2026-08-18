"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import type { CategoryCreate, CategoryOut, CategoryUpdate } from "@/lib/api/commerce";
import { SettingsInput, SettingsTextarea } from "@/components/settings/site/ui/settings-field";
import { EditorLabel, IconPicker } from "@/components/themes/editor/editor-field";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { randomIconValue } from "@/lib/icon-options";

type CoverImage =
  | { kind: "uploaded"; url: string }
  | { kind: "pending"; file: File; previewUrl: string }
  | null;

type CategoryFormModalProps = {
  open: boolean;
  siteId: string | null;
  /** Present = editing; absent = creating. */
  category: CategoryOut | null;
  onClose: () => void;
  onCreate: (data: CategoryCreate) => Promise<void>;
  onUpdate: (id: string, data: CategoryUpdate) => Promise<void>;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  /** Small thumbnail — shown as the circular avatar overlapping the banner. */
  image: CoverImage;
  /** Wide cover — the shop page's per-category banner. */
  banner: CoverImage;
  /** lucide-react icon name — only some templates render a category icon. */
  icon: string;
};

const empty: FormState = {
  name: "",
  slug: "",
  description: "",
  image: null,
  banner: null,
  icon: "",
};

export function CategoryFormModal({
  open,
  siteId,
  category,
  onClose,
  onCreate,
  onUpdate,
}: CategoryFormModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [saveStage, setSaveStage] = useState<"idle" | "uploading" | "saving">("idle");
  const busy = saveStage !== "idle";

  // Re-seed the form whenever a different category is opened for editing,
  // or the modal opens fresh for creating.
  useEffect(() => {
    if (!open) return;
    setForm(
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            image: category.image_url ? { kind: "uploaded", url: category.image_url } : null,
            banner: category.banner_url ? { kind: "uploaded", url: category.banner_url } : null,
            icon: category.icon ?? randomIconValue(),
          }
        // A fresh category still gets a real icon value picked up-front —
        // the admin can change it below, but it's never left unset.
        : { ...empty, icon: randomIconValue() },
    );
  }, [open, category]);

  // Revoke every blob: URL this form ever created, on unmount — otherwise
  // each one leaks until the tab closes.
  const objectUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function pickField(field: "image" | "banner", file: File) {
    // Replacing a still-local (never uploaded) image — free its blob: URL
    // immediately rather than waiting for unmount.
    setForm((f) => {
      const current = f[field];
      if (current?.kind === "pending") {
        URL.revokeObjectURL(current.previewUrl);
        objectUrls.current.delete(current.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { ...f, [field]: { kind: "pending", file, previewUrl } };
    });
  }

  /** Picked from the media library — already a real Cloudinary URL, so this
   * goes straight to "uploaded" and skips resolveUrl's upload-on-save step
   * entirely (there's nothing left to upload). */
  function pickFieldFromLibrary(field: "image" | "banner", image: MediaImage) {
    setForm((f) => {
      const current = f[field];
      if (current?.kind === "pending") {
        URL.revokeObjectURL(current.previewUrl);
        objectUrls.current.delete(current.previewUrl);
      }
      return { ...f, [field]: { kind: "uploaded", url: image.url } };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId || !form.name.trim()) return;

    try {
      // Nothing touches Cloudinary until the moment the category is
      // actually saved — cancelling this form never leaves an orphaned
      // upload behind.
      setSaveStage("uploading");
      const [imageUrl, bannerUrl] = await Promise.all([
        resolveUrl(siteId, form.image, "categories"),
        resolveUrl(siteId, form.banner, "categories"),
      ]);

      setSaveStage("saving");
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        image_url: imageUrl,
        banner_url: bannerUrl,
        icon: form.icon || undefined,
      };
      if (category) {
        await onUpdate(category.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err) {
      toast({
        title: category ? "Couldn't save changes" : "Couldn't create category",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaveStage("idle");
    }
  }

  const imageSrc = form.image?.kind === "uploaded" ? form.image.url : form.image?.previewUrl;
  const bannerSrc = form.banner?.kind === "uploaded" ? form.banner.url : form.banner?.previewUrl;

  return (
    <FormModal
      open={open}
      title={category ? "Edit category" : "New category"}
      busy={busy}
      submitLabel={
        saveStage === "uploading"
          ? "Uploading images…"
          : saveStage === "saving"
            ? "Saving…"
            : category
              ? "Save changes"
              : "Create category"
      }
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {/* Facebook-style cover: wide banner on top, circular thumbnail
         * overlapping its bottom edge — both independently uploadable. The
         * banner is what the shop page swaps in when a visitor picks this
         * category; the circle is the small thumbnail used in listings. */}
        <div className="relative mb-12">
          <MediaSourceMenu
            siteId={siteId}
            category="categories"
            onUploadFiles={(files) => {
              if (files[0]) pickField("banner", files[0]);
            }}
            onPickImages={(images) => {
              if (images[0]) pickFieldFromLibrary("banner", images[0]);
            }}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="group relative block h-32 w-full cursor-pointer overflow-hidden rounded-xl bg-search-bg ring-1 ring-slate-200/80 transition-shadow hover:ring-slate-300"
              >
                {bannerSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerSrc} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-soft">
                    <ImagePlus className="size-5" strokeWidth={1.5} />
                    <span className="text-[11px] font-medium">Add banner</span>
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <ImagePlus className="size-5 text-white" strokeWidth={1.75} />
                </span>
              </button>
            )}
          </MediaSourceMenu>

          <MediaSourceMenu
            siteId={siteId}
            category="categories"
            onUploadFiles={(files) => {
              if (files[0]) pickField("image", files[0]);
            }}
            onPickImages={(images) => {
              if (images[0]) pickFieldFromLibrary("image", images[0]);
            }}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="group absolute -bottom-10 left-1/2 flex size-20 -translate-x-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-search-bg ring-4 ring-white transition-shadow hover:ring-white"
              >
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-4 text-muted-soft" strokeWidth={1.5} />
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <ImagePlus className="size-4 text-white" strokeWidth={1.75} />
                </span>
              </button>
            )}
          </MediaSourceMenu>
        </div>

        <SettingsInput
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Sarees"
        />
        <SettingsInput
          label="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="auto-generated from name if left blank"
        />
        <SettingsTextarea
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
          placeholder="Optional"
        />

        {/* Not every template renders this — e.g. Bazaar's department rail
         * does, Aurora doesn't — but it costs nothing to store, so every
         * category gets one and templates opt in by reading it. */}
        <div>
          <EditorLabel>Icon</EditorLabel>
          <p className="mb-2 text-[11px] text-muted-soft">
            Used by templates with an icon-based category list.
          </p>
          <IconPicker
            value={form.icon}
            onChange={(icon) => setForm((f) => ({ ...f, icon }))}
          />
        </div>
      </div>
    </FormModal>
  );
}

async function resolveUrl(
  siteId: string,
  image: CoverImage,
  category: "hero" | "products" | "categories" | "other",
): Promise<string | undefined> {
  if (image?.kind === "uploaded") return image.url;
  if (image?.kind === "pending") {
    const uploaded = await uploadSiteMedia(siteId, image.file, category);
    return uploaded.url;
  }
  return undefined;
}
