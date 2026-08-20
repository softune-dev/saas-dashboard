"use client";

import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MaskIcon } from "@/components/ui/mask-icon";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia } from "@/lib/api";
import { chatWithAssistant } from "@/lib/api/ai";
import { createProduct, deleteProduct, listProducts } from "@/lib/api/commerce";
import { useOnboarding } from "../onboarding-context";

export function StepProducts() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { state, dispatch } = useOnboarding();
  const siteId = currentSite?.id ?? null;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("499");
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resolvedCategory = categoryId || state.categories[0]?.id || "";

  async function refresh() {
    if (!siteId) return;
    const page = await listProducts(siteId, { limit: 50 });
    dispatch({ type: "setProducts", products: page.items });
  }

  async function add() {
    if (!siteId) {
      toast({
        title: "Couldn't add product",
        description: "No site is set up for this account yet.",
        variant: "info",
      });
      return;
    }
    if (!name.trim() || !resolvedCategory) return;
    const taka = Number(price);
    if (!Number.isFinite(taka) || taka < 0) return;
    setSaving(true);
    try {
      await createProduct(siteId, {
        name: name.trim(),
        price_cents: Math.round(taka * 100),
        category_id: resolvedCategory,
        description: description.trim() || undefined,
        images: imageUrl ? [{ url: imageUrl }] : undefined,
      });
      await refresh();
      setName("");
      setDescription("");
      setImageUrl("");
      setAiError(null);
    } catch (err) {
      toast({
        title: "Couldn't add product",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!siteId) return;
    try {
      await deleteProduct(siteId, id);
      await refresh();
    } catch (err) {
      toast({
        title: "Couldn't remove product",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    }
  }

  async function handleAiGenerate() {
    if (!name.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const promptText = `Write a compelling, concise 2-sentence description for a product named "${name.trim()}". Return only description text.`;
      const res = await chatWithAssistant(promptText, []);
      setDescription(res.reply);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Couldn't generate description.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MaskIcon src="/sidebar/products.svg" className="size-4 text-primary" />
          Add at least one product
        </div>
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={!name.trim() || aiLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-search-bg px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sidebar/gemini.svg" alt="" className="size-3" />
          {aiLoading ? "Writing..." : "AI Write Description"}
        </button>
      </div>

      {state.categories.length === 0 ? (
        <p className="rounded-md bg-search-bg px-3 py-3 text-sm text-muted">
          Add a category in the previous step before creating products.
        </p>
      ) : (
        <div className="flex flex-col gap-3.5 rounded-md border border-border bg-search-bg/60 p-4">
          <SettingsInput
            label="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SettingsInput
              label="Price (৳)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              hint="Stored as integer cents"
            />
            <SettingsSelect
              label="Category"
              value={resolvedCategory}
              onChange={(e) => setCategoryId(e.target.value)}
              options={state.categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Product image</span>
            <MediaSourceMenu
              siteId={siteId}
              category="products"
              onUploadFiles={async (files) => {
                if (files[0]) {
                  if (siteId) {
                    const uploaded = await uploadSiteMedia(siteId, files[0], "products");
                    setImageUrl(uploaded.url);
                  } else {
                    setImageUrl(URL.createObjectURL(files[0]));
                  }
                }
              }}
              onPickImages={(images) => {
                if (images[0]) setImageUrl(images[0].url);
              }}
            >
              {(open) => (
                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Product" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                      >
                        <MaskIcon src="/sidebar/delete.svg" className="size-3" />
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={open}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-search-bg px-4 text-xs font-medium text-muted transition-colors hover:border-slate-400"
                  >
                    <MaskIcon src="/sidebar/media.svg" className="size-4" />
                    {imageUrl ? "Change image" : "Add product image"}
                  </button>
                </div>
              )}
            </MediaSourceMenu>
          </div>

          <div className="relative">
            <SettingsTextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description"
            />
            {aiError && <p className="mt-1 text-[11px] text-rose-500">{aiError}</p>}
          </div>

          <PrimaryButton type="button" onClick={add} disabled={saving} className="w-full min-h-10">
            {saving ? "Adding…" : "Add product"}
          </PrimaryButton>
        </div>
      )}

      {state.products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-8 text-center">
          <MaskIcon src="/sidebar/products.svg" className="size-8 text-muted-soft" />
          <p className="text-sm text-muted">No products yet</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {state.products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-search-bg px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="size-10 shrink-0 rounded object-cover border border-border" />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted">
                    ৳{(p.price_cents / 100).toFixed(0)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="text-muted transition-colors hover:text-foreground"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
