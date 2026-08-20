"use client";

import { MaskIcon } from "@/components/ui/mask-icon";

type CustomAddonCardProps = {
  onRequest: () => void;
};

/** Dashed CTA at the end of the Add-Ons grid — opens the custom request form. */
export function CustomAddonCard({ onRequest }: CustomAddonCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-dashed border-border bg-surface/60 p-5 shadow-sm">
      <MaskIcon
        src="/sidebar/add-on.svg"
        className="size-8 shrink-0 text-foreground"
      />

      <h3 className="mt-4 text-base font-semibold text-foreground">
        Custom Add-on
      </h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
        Need something that isn&apos;t listed? Tell us what you want and we&apos;ll
        review it.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onRequest}
          className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-medium text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
        >
          Request
        </button>
      </div>
    </article>
  );
}
