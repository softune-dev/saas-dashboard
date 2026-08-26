"use client";

import { ArrowLeft, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";
import { useSiteSettingsSWR } from "@/lib/api/site-settings";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { AiGenerateButton } from "@/components/ui/ai-generate-button";
import { generateAiText } from "@/lib/api/ai";
import type { MediaImage } from "@/lib/api";
import {
  createProduct,
  getProduct,
  listCategories,
  updateProduct,
  uploadProductImage,
  uploadProductVideo,
  type CategoryOut,
  type ProductDeliveryCharge,
  type ProductFeature,
  type ProductOut,
  type ProductVariant,
} from "@/lib/api/commerce";
import { ProductDescriptionEditor } from "./product-description-editor";
import { ProductFeaturesEditor } from "./product-features-editor";
import type { GalleryImage } from "./product-form-types";
import { ProductMediaGallery } from "./product-media-gallery";
import { ProductVariantsEditor } from "./product-variants-editor";
import { ProductVideoField } from "./product-video-field";

/** Common stock units — a garment product just leaves this unset (sizes
 * aren't a unit of measure the way weight/volume are). */
const UNIT_OPTIONS = [
  { value: "", label: "None (e.g. garments, sized items)" },
  { value: "pcs", label: "pcs" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "mg", label: "mg" },
  { value: "l", label: "l" },
  { value: "ml", label: "ml" },
];

type FormState = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  compareAt: string;
  stock: string;
  categoryId: string;
  images: GalleryImage[];
  variants: ProductVariant[];
  isActive: boolean;
  videoUrl: string;
  serialNumber: string;
  unit: string;
  initialSoldCount: string;
  freeDelivery: boolean;
  deliveryCharges: ProductDeliveryCharge[];
  features: ProductFeature[];
};

const empty: FormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  price: "",
  compareAt: "",
  stock: "0",
  categoryId: "",
  images: [],
  variants: [],
  isActive: true,
  videoUrl: "",
  serialNumber: "",
  unit: "",
  initialSoldCount: "0",
  freeDelivery: true,
  deliveryCharges: [],
  features: [],
};

function centsToMajor(cents: number): string {
  return (cents / 100).toFixed(2);
}

function majorToCents(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function fromProduct(product: ProductOut): FormState {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? "",
    description: product.description ?? "",
    shortDescription: product.short_description ?? "",
    price: centsToMajor(product.price_cents),
    compareAt: product.compare_at_cents ? centsToMajor(product.compare_at_cents) : "",
    stock: String(product.stock),
    categoryId: product.category_id ?? "",
    images: (product.images ?? []).map((img) => ({
      kind: "uploaded" as const,
      url: img.url,
      public_id: img.public_id,
    })),
    variants: product.attributes?.variants ?? [],
    isActive: product.is_active,
    videoUrl: product.video_url ?? "",
    serialNumber: product.serial_number ?? "",
    unit: product.unit ?? "",
    initialSoldCount: String(product.initial_sold_count ?? 0),
    freeDelivery: product.free_delivery,
    deliveryCharges: product.delivery_charges ?? [],
    features: product.features ?? [],
  };
}

function imageKey(img: GalleryImage): string {
  return img.kind === "uploaded" ? img.url : img.previewUrl;
}

/** Add/Edit Product — media-first layout: primary hero image + thumb rail,
 * then a clean two-column form. Header is title + actions only (no divider). */
export function ProductFormPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();

  const isEdit = !!productId;
  const { data: siteSettings } = useSiteSettingsSWR(currentSite?.id ?? null);
  const shippingLocations = siteSettings?.shipping.locations ?? [];
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStage, setSaveStage] = useState<"idle" | "uploading" | "saving">("idle");
  const busy = saveStage !== "idle";

  // Real facts already on the form — what keeps AI-generated copy specific
  // to this product instead of generic filler. Recomputed fresh on every
  // Generate click (not memoized) since it just reads the latest form state.
  function productAiContext() {
    const category = categories.find((c) => c.id === form.categoryId)?.name;
    return {
      name: form.name.trim(),
      category: category || undefined,
      price: form.price ? `৳${form.price}` : undefined,
      unit: form.unit || undefined,
      variant_types: form.variants.map((v) => v.type).filter(Boolean),
      feature_titles: form.features.map((f) => f.title).filter(Boolean),
    };
  }

  useEffect(() => {
    if (!currentSite) return;
    let cancelled = false;
    (async () => {
      try {
        const [cats, product] = await Promise.all([
          listCategories(currentSite.id),
          isEdit ? getProduct(currentSite.id, productId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCategories(cats);
        if (product) setForm(fromProduct(product));
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSite, isEdit, productId]);

  const objectUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function addPendingImage(file: File) {
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    setForm((f) => ({
      ...f,
      images: [...f.images, { kind: "pending", file, previewUrl }],
    }));
  }

  /** Picked from the media library — already real Cloudinary URLs, so these
   * go straight in as "uploaded" with no pending/upload-on-save step. */
  function addImagesFromLibrary(images: MediaImage[]) {
    setForm((f) => ({
      ...f,
      images: [
        ...f.images,
        ...images.map((img) => ({
          kind: "uploaded" as const,
          url: img.url,
          public_id: img.public_id,
        })),
      ],
    }));
  }

  function removeImage(img: GalleryImage) {
    if (img.kind === "pending") {
      URL.revokeObjectURL(img.previewUrl);
      objectUrls.current.delete(img.previewUrl);
    }
    setForm((f) => ({
      ...f,
      images: f.images.filter((i) => imageKey(i) !== imageKey(img)),
    }));
  }

  // Video, like images, defers the actual upload until save — but unlike
  // images there's only ever one, so a single pending-file slot is enough.
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  function handleVideoFile(file: File) {
    setPendingVideoFile(file);
    setForm((f) => ({ ...f, videoUrl: "" }));
  }

  async function uploadDescriptionImage(file: File): Promise<string> {
    if (!currentSite) throw new Error("Still loading this site.");
    const uploaded = await uploadProductImage(currentSite.id, file);
    return uploaded.url;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentSite || !form.name.trim() || !form.price.trim()) return;

    try {
      setSaveStage("uploading");
      const resolvedImages = await Promise.all(
        form.images.map(async (img) => {
          if (img.kind === "uploaded") return { url: img.url, public_id: img.public_id };
          const uploaded = await uploadProductImage(currentSite.id, img.file);
          return uploaded;
        }),
      );

      let videoUrl = form.videoUrl.trim();
      if (pendingVideoFile) {
        setVideoUploading(true);
        try {
          const uploaded = await uploadProductVideo(currentSite.id, pendingVideoFile);
          videoUrl = uploaded.url;
        } finally {
          setVideoUploading(false);
        }
      }

      setSaveStage("saving");
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        short_description: form.shortDescription.trim() || undefined,
        price_cents: majorToCents(form.price),
        compare_at_cents: form.compareAt.trim() ? majorToCents(form.compareAt) : undefined,
        currency: "BDT",
        stock: Number.parseInt(form.stock, 10) || 0,
        category_id: form.categoryId || null,
        images: resolvedImages,
        attributes: { variants: form.variants },
        is_active: form.isActive,
        video_url: videoUrl || undefined,
        serial_number: form.serialNumber.trim() || undefined,
        unit: form.unit || undefined,
        initial_sold_count: Number.parseInt(form.initialSoldCount, 10) || 0,
        free_delivery: form.freeDelivery,
        delivery_charges: form.freeDelivery ? [] : form.deliveryCharges,
        // Backend requires a non-empty title per feature — drop any row the
        // merchant started but never named, rather than rejecting the save.
        features: form.features
          .filter((f) => f.title.trim())
          .map((f) => ({ title: f.title.trim(), description: f.description.trim() })),
      };
      if (isEdit) {
        await updateProduct(currentSite.id, productId, payload);
        toast({ title: "Product updated", variant: "success" });
      } else {
        await createProduct(currentSite.id, payload);
        toast({ title: "Product created", variant: "success" });
      }
      router.push("/products");
    } catch (err) {
      toast({
        title: isEdit ? "Couldn't save changes" : "Couldn't create product",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaveStage("idle");
    }
  }

  if (!sessionLoading && !currentSite) {
    return (
      <EmptyState
        icon={ImagePlus}
        title="No site yet"
        description="Create a site from a template in Themes before adding products."
      />
    );
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-11 w-full max-w-md animate-pulse rounded-xl bg-surface" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-surface lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return <EmptyState icon={ImagePlus} title="Couldn't load product" description={loadError} />;
  }

  const saveLabel =
    saveStage === "uploading"
      ? "Uploading images…"
      : saveStage === "saving"
        ? "Saving…"
        : "Save Product";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6">
      {/* Title + actions only — no divider line under the header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/products")}
            aria-label="Back to products"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            {isEdit && form.name ? (
              <p className="truncate text-sm text-muted">{form.name}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/products")}
            disabled={busy}
            className="hidden h-10 items-center justify-center rounded-full bg-surface px-5 text-sm font-medium text-foreground shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-search-bg disabled:opacity-60 sm:inline-flex"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* Media first */}
      <ProductMediaGallery
        siteId={currentSite?.id ?? null}
        images={form.images}
        onChange={(images) => setForm((f) => ({ ...f, images }))}
        onAdd={addPendingImage}
        onAddFromLibrary={addImagesFromLibrary}
        onRemove={removeImage}
      />

      {/* Details + variants (left) · organization (right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <section className="rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-foreground">Details</h2>
            <div className="flex flex-col gap-4">
              <SettingsInput
                label="Product Title"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Structured Jacket"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SettingsInput
                  label="Price (৳)"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                />
                <SettingsInput
                  label="Compare-at (৳)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.compareAt}
                  onChange={(e) => setForm((f) => ({ ...f, compareAt: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <SettingsTextarea
                label="Short Description"
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                rows={2}
                maxLength={300}
                placeholder="One or two sentences — used for SEO and search result snippets."
                labelExtra={
                  <AiGenerateButton
                    hasContext={!!form.name.trim()}
                    hasContent={!!form.shortDescription.trim()}
                    onGenerate={async () => {
                      const text = await generateAiText(
                        "product_short_description",
                        productAiContext(),
                        form.shortDescription,
                      );
                      setForm((f) => ({ ...f, shortDescription: text }));
                    }}
                  />
                }
              />
              <ProductDescriptionEditor
                value={form.description}
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                onUploadImage={uploadDescriptionImage}
                headerRight={
                  <AiGenerateButton
                    hasContext={!!form.name.trim()}
                    hasContent={!!form.description.trim()}
                    onGenerate={async () => {
                      const text = await generateAiText(
                        "product_description",
                        productAiContext(),
                        form.description,
                      );
                      setForm((f) => ({ ...f, description: text }));
                    }}
                  />
                }
              />
            </div>
          </section>

          <section className="rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-foreground">Video</h2>
            <ProductVideoField
              value={form.videoUrl}
              onChange={(videoUrl) => {
                setPendingVideoFile(null);
                setForm((f) => ({ ...f, videoUrl }));
              }}
              uploading={videoUploading}
              onUploadFile={handleVideoFile}
            />
            {pendingVideoFile ? (
              <p className="mt-2 text-xs text-muted">
                Ready to upload: {pendingVideoFile.name} — uploads when you save.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl bg-surface p-5 sm:p-6">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">Variants</h2>
              <p className="text-xs text-muted">Optional · Size, Weight, Color…</p>
            </div>
            <ProductVariantsEditor
              variants={form.variants}
              basePriceCents={majorToCents(form.price)}
              onChange={(variants) => setForm((f) => ({ ...f, variants }))}
              siteId={currentSite?.id ?? null}
            />
          </section>

          <section className="rounded-2xl bg-surface p-5 sm:p-6">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">
                Feature highlights
              </h2>
              <p className="text-xs text-muted">
                Optional · shown as icon callouts on the product page
              </p>
            </div>
            <ProductFeaturesEditor
              features={form.features}
              onChange={(features) => setForm((f) => ({ ...f, features }))}
            />
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-foreground">Organization</h2>
            <SettingsSelect
              label="Status"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.value === "active" }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            <SettingsSelect
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              options={[
                { value: "", label: "Uncategorized" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <SettingsInput
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated if left blank"
            />
          </section>

          <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-foreground">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <SettingsInput
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Optional"
              />
              <SettingsInput
                label="Product Serial"
                value={form.serialNumber}
                onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <SettingsSelect
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              options={UNIT_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-4">
              <SettingsInput
                label="Stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              />
              <SettingsInput
                label="Initial Sold Count"
                type="number"
                min="0"
                value={form.initialSoldCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initialSoldCount: e.target.value }))
                }
              />
            </div>
            <p className="-mt-2 text-[11px] text-muted-soft">
              Initial Sold Count is a starting number shown alongside real orders —
              not a real sales figure on its own.
            </p>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-foreground">Shipping</h2>
            <button
              type="button"
              role="switch"
              aria-checked={form.freeDelivery}
              onClick={() =>
                setForm((f) => ({ ...f, freeDelivery: !f.freeDelivery }))
              }
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-sm font-medium text-foreground">
                {form.freeDelivery ? "Free delivery" : "Delivery charge applies"}
              </span>
              <span
                className={[
                  "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  form.freeDelivery ? "justify-end bg-primary" : "justify-start bg-slate-300",
                ].join(" ")}
              >
                <span className="size-5 rounded-full bg-surface shadow-sm" />
              </span>
            </button>
            {!form.freeDelivery ? (
              shippingLocations.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-muted">
                    Delivery charges
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {shippingLocations.map((loc) => {
                      const checked = form.deliveryCharges.some((dc) => dc.name === loc.name);
                      return (
                        <li key={loc.id}>
                          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                            <span className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    deliveryCharges: e.target.checked
                                      ? [...f.deliveryCharges, { name: loc.name, charge_cents: loc.charge_cents }]
                                      : f.deliveryCharges.filter((dc) => dc.name !== loc.name),
                                  }))
                                }
                                className="size-3.5 rounded border-slate-300 accent-primary"
                              />
                              {loc.name}
                            </span>
                            <span className="text-muted-soft">
                              ৳{(loc.charge_cents / 100).toFixed(2)}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-xs text-muted-soft">
                    Pick every location this product can ship to. Add or edit locations in Site Settings → Shipping.
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-search-bg px-3 py-4 text-xs text-muted-soft">
                  No delivery locations saved yet. Add some in Site Settings → Shipping, then come back here to pick which ones apply to this product.
                </p>
              )
            ) : null}
          </section>
        </div>
      </div>
    </form>
  );
}
