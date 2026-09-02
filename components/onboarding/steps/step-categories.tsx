"use client";

import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { CategoryFormModal } from "@/components/categories/category-form-modal";
import type { CategoryCreate, CategoryUpdate } from "@/lib/api/commerce";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api/commerce";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useToast } from "@/components/ui/toast";
import { useOnboarding } from "../onboarding-context";

export function StepCategories() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { state, dispatch } = useOnboarding();
  const [modalOpen, setModalOpen] = useState(false);
  const siteId = currentSite?.id ?? null;

  // The wizard's context already prefilled state.categories on mount — this
  // just re-reads after every write so the list always reflects what the
  // backend actually has (no client-generated ids, no drift).
  async function refresh() {
    if (!siteId) return;
    const categories = await listCategories(siteId);
    dispatch({ type: "setCategories", categories });
  }

  async function handleCreate(data: CategoryCreate) {
    if (!siteId) {
      toast({
        title: "Couldn't create category",
        description: "No site is set up for this account yet.",
        variant: "info",
      });
      return;
    }
    try {
      await createCategory(siteId, data);
      await refresh();
    } catch (err) {
      toast({
        title: "Couldn't create category",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    }
  }

  async function handleUpdate(id: string, data: CategoryUpdate) {
    if (!siteId) return;
    await updateCategory(siteId, id, data);
    await refresh();
  }

  async function handleRemove(id: string) {
    if (!siteId) return;
    try {
      await deleteCategory(siteId, id);
      await refresh();
    } catch (err) {
      toast({
        title: "Couldn't remove category",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MaskIcon src="/sidebar/categories.svg" className="size-4 text-primary" />
          Add one category
        </div>
        <PrimaryButton
          type="button"
          onClick={() => setModalOpen(true)}
          className="min-h-9 px-3 text-xs"
          disabled={!siteId}
        >
          <MaskIcon src="/sidebar/plus.svg" className="size-3.5 text-white" />
          Add category
        </PrimaryButton>
      </div>

      {state.categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-8 text-center">
          <MaskIcon src="/sidebar/categories.svg" className="size-8 text-muted-soft" />
          <p className="text-sm text-muted">No categories yet</p>
          <PrimaryButton
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 min-h-9 px-4 text-xs"
            disabled={!siteId}
          >
            Create your first category
          </PrimaryButton>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {state.categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-search-bg px-3 py-2.5"
            >
              <div className="flex items-center gap-4 min-w-0">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="size-16 shrink-0 rounded-md object-cover border border-border bg-surface" />
                ) : null}
                <span className="truncate text-base font-semibold text-foreground">{c.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                className="shrink-0 text-muted transition-colors hover:text-foreground"
                aria-label={`Remove ${c.name}`}
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
              </button>
            </li>
          ))}
          {/* Empty slots up to 5, so the list reads as "a shop with room for
              categories" instead of one lonely row after the first add. */}
          {Array.from({ length: Math.max(0, 5 - state.categories.length) }).map((_, i) => (
            <li
              key={`skeleton-${i}`}
              aria-hidden
              className="flex items-center gap-4 rounded-md border border-dashed border-border px-3 py-2.5"
            >
              <span className="size-16 shrink-0 animate-pulse rounded-md bg-search-bg" />
              <span className="h-4 w-28 animate-pulse rounded bg-search-bg" />
            </li>
          ))}
        </ul>
      )}

      <CategoryFormModal
        open={modalOpen}
        siteId={siteId}
        category={null}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
