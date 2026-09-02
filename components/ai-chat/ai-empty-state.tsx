"use client";

import { MaskIcon } from "@/components/ui/mask-icon";
import { ArrowUpRight } from "lucide-react";
import { useSuggestedPromptsSWR } from "@/lib/api/ai";

type AiEmptyStateProps = {
  onSelectSuggestion: (prompt: string) => void;
  isThemeEditor?: boolean;
};

const SKELETON_WIDTHS = ["88%", "72%", "80%", "64%"] as const;

export function AiEmptyState({ onSelectSuggestion, isThemeEditor }: AiEmptyStateProps) {
  const { data: suggestions, isLoading } = useSuggestedPromptsSWR(
    isThemeEditor ? "theme_editor" : "default",
  );
  const showPrompts = Boolean(suggestions && suggestions.length > 0);

  return (
    <div className="flex flex-1 flex-col justify-center p-6 text-left">
      <img
        src="/sidebar/gemini.svg"
        alt="Gemini"
        className="mb-4 size-8"
      />

      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {isThemeEditor
          ? "How can I help you design & set up your store?"
          : "What would you like to build or analyze?"}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-soft">
        {isThemeEditor
          ? "Ask me to generate color schemes, copywrite hero headlines, or structure homepage sections."
          : "Tag store data using @ or drop files into the input below."}
      </p>

      {isLoading || showPrompts ? (
        <div className="mt-8 flex w-full flex-col gap-2.5">
          <span className="text-left text-xs font-semibold tracking-wider text-muted uppercase">
            {isThemeEditor ? "Theme Editor Prompts" : "Suggested Prompts"}
          </span>
          <div
            className="grid grid-cols-1 gap-2"
            aria-busy={isLoading}
            aria-live="polite"
          >
            {isLoading
              ? SKELETON_WIDTHS.map((width) => (
                  <div
                    key={width}
                    className="flex items-center gap-2.5 py-1.5"
                    aria-hidden
                  >
                    <div className="size-4 shrink-0 animate-pulse rounded bg-search-bg" />
                    <div
                      className="h-3.5 animate-pulse rounded-full bg-search-bg"
                      style={{ width }}
                    />
                  </div>
                ))
              : (suggestions ?? []).map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => onSelectSuggestion(suggestion.text)}
                    className="group flex items-center justify-between py-1.5 text-left text-sm font-medium text-muted transition-colors hover:text-primary"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <MaskIcon src={suggestion.icon} className="size-4 shrink-0" />
                      <span className="truncate text-foreground transition-colors group-hover:text-primary">
                        {suggestion.text}
                      </span>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </button>
                ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
