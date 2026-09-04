"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { PageHeading } from "@/components/ui/page-heading";

type DropshipShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DropshipShell({ title, actions, children }: DropshipShellProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 pb-2 min-h-[calc(100dvh-5.5rem)]">
      <PageHeading title={t("Dropship")} actions={actions} tag={t("Under Maintenance")} />

      <section className="relative min-w-0 flex-1 flex flex-col overflow-hidden rounded-md bg-surface p-4 sm:p-6 min-h-[calc(100dvh-9.5rem)]">
        <div aria-hidden="true" className="pointer-events-none blur-[4px] select-none opacity-40 flex-1">
          <h2 className="mb-5 text-base font-semibold text-foreground">{title}</h2>
          {children}
        </div>

        <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-surface/65 px-4 pt-6 pb-12 sm:pt-10 sm:px-6">
          <div className="flex w-full max-w-xl sm:max-w-2xl flex-col items-center gap-5 rounded-2xl border border-border bg-surface p-8 sm:p-12 text-center shadow-2xl my-auto sm:my-6">
            <div className="relative size-48 sm:size-64 shrink-0">
              <Image
                src="/others/maintanance.webp"
                alt="Under Maintenance"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("Under Maintenance")}
              </h3>
              <p className="max-w-lg text-base sm:text-lg leading-relaxed text-muted">
                {t("Dropship is currently under maintenance. This feature will be available soon.")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
