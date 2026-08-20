"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { GettingStartedStep } from "./use-getting-started-progress";

type GettingStartedStepCardProps = {
  step: GettingStartedStep;
  index: number;
};

export function GettingStartedStepCard({
  step,
  index,
}: GettingStartedStepCardProps) {
  if (step.done) {
    return (
      <article className="flex items-center gap-3 rounded-md bg-surface px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {step.title}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          Done
        </span>
        <Link
          href={step.href}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
          aria-label={`Open ${step.title}`}
        >
          <ArrowUpRight className="size-4" strokeWidth={2} />
        </Link>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-md bg-surface p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-search-bg text-sm font-semibold text-foreground">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {step.title}
          </h3>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600">
            Pending
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {step.description}
        </p>
      </div>
      <Link
        href={step.href}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {step.cta}
        <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
      </Link>
    </article>
  );
}
