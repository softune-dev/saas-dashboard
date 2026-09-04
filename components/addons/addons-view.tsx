"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { useToast } from "@/components/ui/toast";
import { Puzzle } from "lucide-react";
import { AddonCard } from "./addon-card";
import {
  ADDON_CATALOG,
  ADDON_CATEGORIES,
  type AddonCatalogEntry,
} from "./addon-data";
import { AddonLearnModal } from "./addon-learn-modal";
import { CustomAddonCard } from "./custom-addon-card";
import { CustomAddonModal } from "./custom-addon-modal";

/** Softune Add-Ons catalog — request-only UI until enablement is wired. */
export function AddonsView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [learnEntry, setLearnEntry] = useState<AddonCatalogEntry | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const byCategory = useMemo(() => {
    return ADDON_CATEGORIES.map((category) => ({
      category,
      items: ADDON_CATALOG.filter((a) => a.category === category),
    })).filter((g) => g.items.length > 0);
  }, []);

  if (!sessionLoading && !currentSite) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title={t("Add-Ons")} />
        <EmptyState
          icon={Puzzle}
          title="No site yet"
          description="Create a site from a template in Themes before requesting add-ons."
        />
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title={t("Add-Ons")} />
        <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title={t("Add-Ons")} />

      <div className="flex flex-col gap-8">
        {byCategory.map(({ category, items }, index) => {
          const isLast = index === byCategory.length - 1;
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((entry) => (
                  <AddonCard
                    key={entry.id}
                    entry={entry}
                    onRequest={() =>
                      toast({
                        title: "Request sent",
                        description:
                          "Our team will reach out to enable this.",
                        variant: "success",
                      })
                    }
                    onLearnMore={() => setLearnEntry(entry)}
                  />
                ))}
                {isLast ? (
                  <CustomAddonCard onRequest={() => setCustomOpen(true)} />
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <AddonLearnModal
        open={!!learnEntry}
        entry={learnEntry}
        onClose={() => setLearnEntry(null)}
      />

      <CustomAddonModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSubmit={({ name }) => {
          setCustomOpen(false);
          toast({
            title: "Custom request sent",
            description: `We'll review “${name}” and get back to you.`,
            variant: "success",
          });
        }}
      />
    </div>
  );
}
