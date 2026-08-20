"use client";

import { CheckCircle2, ListChecks } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { GettingStartedStepCard } from "./getting-started-step-card";
import { useGettingStartedProgress } from "./use-getting-started-progress";

/** Circular progress — same stroke language as the My Shop storage ring. */
function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const offset = c * (1 - pct);

  return (
    <span
      className="relative flex size-14 shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-foreground">
        {completed}/{total}
      </span>
    </span>
  );
}

export function GettingStartedView() {
  const { loading: sessionLoading } = useSession();
  const { steps, completed, total, allDone, loading, hasSite } =
    useGettingStartedProgress();

  if (!sessionLoading && !hasSite) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Setup" />
        <EmptyState
          icon={ListChecks}
          title="No site yet"
          description="Create a site from a template in Themes before starting setup."
        />
      </div>
    );
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Setup" />
        <div className="h-28 animate-pulse rounded-md bg-surface" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const pending = steps.filter((s) => !s.done);
  const done = steps.filter((s) => s.done);

  return (
    <div className="flex flex-col gap-5 pb-2">
      <PageHeading title="Setup" />

      <section className="flex flex-col gap-4 rounded-md bg-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <ProgressRing completed={completed} total={total} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {allDone
              ? "Your shop is ready to launch"
              : `${completed} of ${total} steps complete`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {allDone
              ? "Every launch checklist item is done. You can revisit this page anytime."
              : "Finish the remaining steps to get your Softune storefront live."}
          </p>
        </div>
        {allDone ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:self-center">
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
            All done
          </span>
        ) : null}
      </section>

      {pending.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Up next
          </h3>
          <div className="flex flex-col gap-3">
            {pending.map((step) => {
              const index =
                steps.findIndex((s) => s.id === step.id) + 1;
              return (
                <GettingStartedStepCard
                  key={step.id}
                  step={step}
                  index={index}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Completed
          </h3>
          <div className="flex flex-col gap-2">
            {done.map((step) => {
              const index =
                steps.findIndex((s) => s.id === step.id) + 1;
              return (
                <GettingStartedStepCard
                  key={step.id}
                  step={step}
                  index={index}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
