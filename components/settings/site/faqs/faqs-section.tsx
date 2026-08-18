"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import { saveSiteFaqs, useSiteSettingsSWR, type SiteFaq } from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsInput, SettingsTextarea } from "../ui/settings-field";
import { SettingsListRowSkeleton } from "../ui/settings-skeleton";

export function FaqsSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [faqs, setFaqs] = useState<SiteFaq[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setFaqs(data.faqs ?? []);
  }, [data]);

  function addFaq() {
    setFaqs((list) => [...list, { id: String(Date.now()), question: "", answer: "" }]);
  }

  function removeFaq(id: string) {
    setFaqs((list) => list.filter((f) => f.id !== id));
  }

  function updateFaq(id: string, patch: Partial<SiteFaq>) {
    setFaqs((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    try {
      const cleaned = faqs.filter((f) => f.question.trim() && f.answer.trim());
      const updated = await saveSiteFaqs(siteId, cleaned);
      setFaqs(updated.faqs);
      await mutate({ ...data!, faqs: updated.faqs }, { revalidate: false });
      toast({ title: "FAQs saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save FAQs",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <SettingsListRowSkeleton />
        <SettingsListRowSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">Questions</p>
        <PrimaryButton
          type="button"
          onClick={addFaq}
          className="!h-9 !px-3 text-xs"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add FAQ
        </PrimaryButton>
      </div>

      <ul className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <li
            key={faq.id}
            className="flex flex-col gap-3 rounded-md border border-slate-200 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted-soft uppercase">
                FAQ {index + 1}
              </span>
              <button
                type="button"
                aria-label={`Remove FAQ ${index + 1}`}
                onClick={() => removeFaq(faq.id)}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
              </button>
            </div>

            <SettingsInput
              label="Question"
              value={faq.question}
              onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
              placeholder="e.g. How do I track my order?"
            />
            <SettingsTextarea
              label="Answer"
              value={faq.answer}
              onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
              placeholder="Write a clear, short answer…"
              className="!min-h-[100px]"
            />
          </li>
        ))}
      </ul>

      {faqs.length === 0 ? (
        <p className="rounded-md bg-search-bg px-4 py-8 text-center text-sm text-muted">
          No FAQs yet. Click "Add FAQ" to create one.
        </p>
      ) : null}

      <SettingsActions saveLabel={saving ? "Saving…" : "Save FAQs"} onSave={handleSave} />
    </div>
  );
}
