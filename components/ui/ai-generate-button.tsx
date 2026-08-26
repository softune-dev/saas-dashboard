"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { AI_USAGE_SWR_KEY } from "@/lib/api/ai";
import { useToast } from "@/components/ui/toast";

/**
 * The circular Gemini-icon button next to any description-style field
 * (product/category descriptions, SEO meta/OG description, About
 * paragraphs). Label switches between "Generate" and "Regenerate" based on
 * whether the field already has content; the button itself stays disabled
 * until `hasContext` is true — the AI needs to actually know what it's
 * writing about (a product name, a site name) before it can write anything
 * worth keeping, so there's nothing useful to click before that exists.
 */
export function AiGenerateButton({
  hasContext,
  hasContent,
  onGenerate,
  className = "",
}: {
  /** True once the minimum real-world context (e.g. product name) this
   * field's copy depends on is actually filled in. */
  hasContext: boolean;
  /** True when the target field already has text — flips the label to
   * "Regenerate" and tells the backend to improve the draft, not replace it
   * from nothing. */
  hasContent: boolean;
  onGenerate: () => Promise<void>;
  className?: string;
}) {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const disabled = !hasContext || loading;

  async function handleClick() {
    if (disabled) return;
    setLoading(true);
    try {
      await onGenerate();
      mutate(AI_USAGE_SWR_KEY);
    } catch (err) {
      toast({
        title: "Couldn't generate text",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        !hasContext
          ? "Fill in more details first so the AI knows what to write about"
          : hasContent
            ? "Regenerate with AI"
            : "Generate with AI"
      }
      className={[
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border bg-search-bg pr-2.5 pl-1.5 text-[11px] font-semibold text-muted transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-primary hover:text-primary",
        className,
      ].join(" ")}
    >
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <img
          src="/sidebar/gemini.svg"
          alt=""
          className={["size-2.5", loading ? "animate-pulse" : ""].join(" ")}
        />
      </span>
      {loading ? "Generating…" : hasContent ? "Regenerate" : "Generate"}
    </button>
  );
}
