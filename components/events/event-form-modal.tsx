"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import type {
  EventCreate,
  EventOut,
  EventUpdate,
  ProductOut,
} from "@/lib/api/commerce";
import { SettingsInput, SettingsTextarea } from "@/components/settings/site/ui/settings-field";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { EventProductPicker } from "./event-product-picker";

type CoverImage =
  | { kind: "uploaded"; url: string }
  | { kind: "pending"; file: File; previewUrl: string }
  | null;

type EventFormModalProps = {
  open: boolean;
  siteId: string | null;
  /** Present = editing; absent = creating. */
  event: EventOut | null;
  products: ProductOut[];
  onClose: () => void;
  onCreate: (data: EventCreate) => Promise<void>;
  onUpdate: (id: string, data: EventUpdate) => Promise<void>;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  ctaLabel: string;
  discountPercent: string;
  isActive: boolean;
  productIds: string[];
  image: CoverImage;
};

const empty: FormState = {
  name: "",
  slug: "",
  description: "",
  ctaLabel: "Shop now",
  discountPercent: "",
  isActive: false,
  productIds: [],
  image: null,
};

export function EventFormModal({
  open,
  siteId,
  event,
  products,
  onClose,
  onCreate,
  onUpdate,
}: EventFormModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [saveStage, setSaveStage] = useState<"idle" | "uploading" | "saving">("idle");
  const busy = saveStage !== "idle";

  useEffect(() => {
    if (!open) return;
    setForm(
      event
        ? {
            name: event.name,
            slug: event.slug,
            description: event.description ?? "",
            ctaLabel: event.cta_label,
            discountPercent: String(event.discount_percent),
            isActive: event.is_active,
            productIds: event.product_ids,
            image: event.image_url ? { kind: "uploaded", url: event.image_url } : null,
          }
        : empty,
    );
  }, [open, event]);

  // Revoke every blob: URL this form ever created, on unmount.
  const objectUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function pickImage(file: File) {
    setForm((f) => {
      if (f.image?.kind === "pending") {
        URL.revokeObjectURL(f.image.previewUrl);
        objectUrls.current.delete(f.image.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { ...f, image: { kind: "pending", file, previewUrl } };
    });
  }

  function pickImageFromLibrary(image: MediaImage) {
    setForm((f) => {
      if (f.image?.kind === "pending") {
        URL.revokeObjectURL(f.image.previewUrl);
        objectUrls.current.delete(f.image.previewUrl);
      }
      return { ...f, image: { kind: "uploaded", url: image.url } };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId || !form.name.trim()) return;
    const discountPercent = Number(form.discountPercent);
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90) {
      toast({
        title: "Invalid discount",
        description: "Discount must be a whole number between 1 and 90.",
        variant: "info",
      });
      return;
    }

    try {
      setSaveStage("uploading");
      let imageUrl: string | undefined;
      if (form.image?.kind === "uploaded") {
        imageUrl = form.image.url;
      } else if (form.image?.kind === "pending") {
        const uploaded = await uploadSiteMedia(siteId, form.image.file, "events");
        imageUrl = uploaded.url;
      }

      setSaveStage("saving");
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        image_url: imageUrl,
        cta_label: form.ctaLabel.trim() || "Shop now",
        discount_percent: Math.round(discountPercent),
        product_ids: form.productIds,
        is_active: form.isActive,
      };
      if (event) {
        await onUpdate(event.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err) {
      toast({
        title: event ? "Couldn't save changes" : "Couldn't create event",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaveStage("idle");
    }
  }

  const imageSrc = form.image?.kind === "uploaded" ? form.image.url : form.image?.previewUrl;

  return (
    <FormModal
      open={open}
      title={event ? "Edit event" : "New event"}
      busy={busy}
      submitLabel={
        saveStage === "uploading"
          ? "Uploading image…"
          : saveStage === "saving"
            ? "Saving…"
            : event
              ? "Save changes"
              : "Create event"
      }
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <MediaSourceMenu
          siteId={siteId}
          category="events"
          onUploadFiles={(files) => {
            if (files[0]) pickImage(files[0]);
          }}
          onPickImages={(images) => {
            if (images[0]) pickImageFromLibrary(images[0]);
          }}
        >
          {(open) => (
            <button
              type="button"
              onClick={open}
              className="group relative block h-36 w-full cursor-pointer overflow-hidden rounded-xl bg-search-bg ring-1 ring-border dark:ring-transparent transition-shadow hover:ring-muted-soft dark:hover:ring-transparent"
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-soft">
                  <ImagePlus className="size-5" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium">Add event image</span>
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus className="size-5 text-white" strokeWidth={1.75} />
              </span>
            </button>
          )}
        </MediaSourceMenu>

        <SettingsInput
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Summer Sale"
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
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="A short line shown on the storefront card"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsInput
            label="Discount %"
            required
            type="number"
            min={1}
            max={90}
            value={form.discountPercent}
            onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
            placeholder="e.g. 20"
          />
          <SettingsInput
            label="Button label"
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            placeholder="Shop now"
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.isActive}
          onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-search-bg px-3 py-2.5 text-left"
        >
          <span className="text-sm font-medium text-foreground">
            {form.isActive
              ? "Active — discount applies at checkout now"
              : "Inactive — draft, no discount applied"}
          </span>
          <span
            className={[
              "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
              form.isActive ? "justify-end bg-primary" : "justify-start bg-slate-300",
            ].join(" ")}
          >
            <span className="size-5 rounded-full bg-surface shadow-sm" />
          </span>
        </button>

        <EventProductPicker
          selectedIds={form.productIds}
          options={products}
          onChange={(ids) => setForm((f) => ({ ...f, productIds: ids }))}
        />
      </div>
    </FormModal>
  );
}
