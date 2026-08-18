"use client";

import { MaskIcon } from "@/components/ui/mask-icon";
import { ArrowUpRight } from "lucide-react";
import { DEFAULT_SUGGESTIONS, THEME_EDITOR_SUGGESTIONS } from "./ai-chat-store";

type AiEmptyStateProps = {
  onSelectSuggestion: (prompt: string) => void;
  isThemeEditor?: boolean;
};

export function AiEmptyState({ onSelectSuggestion, isThemeEditor }: AiEmptyStateProps) {
  const suggestions = isThemeEditor ? THEME_EDITOR_SUGGESTIONS : DEFAULT_SUGGESTIONS;

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

      {/* Suggestion Cards with Sidebar Icons */}
      <div className="mt-8 flex w-full flex-col gap-2.5">
        <span className="text-left text-xs font-semibold tracking-wider text-muted uppercase">
          {isThemeEditor ? "Theme Editor Prompts" : "Suggested Prompts"}
        </span>
        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              type="button"
              onClick={() => onSelectSuggestion(suggestion.text)}
              className="group flex items-center justify-between py-1.5 text-left text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MaskIcon src={suggestion.icon} className="size-4 shrink-0" />
                <span className="truncate text-foreground transition-colors group-hover:text-primary">{suggestion.text}</span>
              </div>
              <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
