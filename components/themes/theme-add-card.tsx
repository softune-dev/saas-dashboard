import { Plus } from "lucide-react";

/**
 * Same structure as theme cards.
 * Account already has 1 site — this adds a social media funnel only.
 */
export function ThemeAddCard() {
  return (
    <button
      type="button"
      className="relative flex flex-col rounded-2xl bg-surface px-1.5 pt-1.5 pb-3 text-left transition-opacity hover:opacity-95"
    >
      <div
        className="flex aspect-[16/11] w-full items-center justify-center bg-background"
        style={{
          borderRadius: "0.5rem 0.5rem 1.25rem 1.25rem",
        }}
      >
        <Plus className="size-10 text-primary" strokeWidth={1.5} />
      </div>

      <div className="mt-2.5 flex items-center gap-2 px-1.5">
        <div className="min-w-0 flex-1 truncate pt-0.5">
          <span className="text-base font-semibold text-foreground mr-2">
            Add Funnels
          </span>
          <span className="text-xs text-muted">
            Social media funnel only
          </span>
        </div>

        <span
          className="inline-flex size-9 shrink-0 items-center justify-center text-primary"
          aria-hidden
        >
          <Plus className="size-6" strokeWidth={1.75} />
        </span>
      </div>
    </button>
  );
}
