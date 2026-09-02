"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  SettingsInput,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";
import { MaskIcon } from "@/components/ui/mask-icon";
import { getSiteSettings, saveSiteAbout, saveSiteBusiness, saveSiteFaqs, saveSiteLegal } from "@/lib/api/site-settings";
import { useOnboarding } from "../onboarding-context";

export function StepStoreInfo() {
  const { currentSite } = useSession();
  const { state, dispatch, registerSaveHandler } = useOnboarding();
  const siteId = currentSite?.id ?? null;

  // Batches this step's four sections (business contact, about, legal docs,
  // one FAQ) into their real PATCH calls right before the wizard advances.
  useEffect(() => {
    registerSaveHandler(async () => {
      if (!siteId) return;
      const settings = await getSiteSettings(siteId);
      await saveSiteBusiness(siteId, {
        ...settings.business,
        phone: state.contactPhone || undefined,
        email: state.contactEmail || undefined,
      });
      await saveSiteAbout(siteId, {
        ...settings.about,
        heading: state.aboutHeading || undefined,
        paragraphs: state.aboutStory ? state.aboutStory.split(/\n{2,}/) : settings.about?.paragraphs,
      });
      await saveSiteLegal(siteId, {
        terms: { title: state.termsTitle, content: state.termsContent, published: !!state.termsContent },
        privacy: {
          title: state.privacyTitle,
          content: state.privacyContent,
          published: !!state.privacyContent,
        },
      });
      if (state.faqQuestion.trim() && state.faqAnswer.trim()) {
        const existing = settings.faqs ?? [];
        const rest = existing.filter((f) => f.question !== state.faqQuestion);
        await saveSiteFaqs(siteId, [
          ...rest,
          { id: existing[0]?.id ?? crypto.randomUUID(), question: state.faqQuestion, answer: state.faqAnswer },
        ]);
      }
    });
    return () => registerSaveHandler(null);
  }, [
    registerSaveHandler,
    siteId,
    state.contactPhone,
    state.contactEmail,
    state.aboutHeading,
    state.aboutStory,
    state.termsTitle,
    state.termsContent,
    state.privacyTitle,
    state.privacyContent,
    state.faqQuestion,
    state.faqAnswer,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/shop-bag.svg" className="size-4 text-primary" />
        Store information & legal policies
      </div>

      {/* Contact Section */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-search-bg/40 p-4">
        <div className="flex items-center gap-2">
          <MaskIcon src="/sidebar/account.svg" className="size-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Contact
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SettingsInput
            label="Business phone"
            value={state.contactPhone}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "contactPhone",
                value: e.target.value,
              })
            }
            placeholder="+8801700000000"
          />
          <SettingsInput
            label="Business email"
            type="email"
            value={state.contactEmail}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "contactEmail",
                value: e.target.value,
              })
            }
            placeholder="hello@yourshop.com"
          />
        </div>
      </div>

      {/* About Us Section */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-search-bg/40 p-4">
        <div className="flex items-center gap-2">
          <MaskIcon src="/sidebar/brand.svg" className="size-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            About Us
          </p>
        </div>
        <SettingsInput
          label="About heading"
          value={state.aboutHeading}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "aboutHeading",
              value: e.target.value,
            })
          }
          placeholder="Type your about heading"
        />
        <SettingsTextarea
          label="About story"
          value={state.aboutStory}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "aboutStory",
              value: e.target.value,
            })
          }
          rows={3}
          placeholder="Tell shoppers the story behind your store…"
        />
      </div>

      {/* Terms of Service Section */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-search-bg/40 p-4">
        <div className="flex items-center gap-2">
          <MaskIcon src="/sidebar/lock.svg" className="size-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Terms of Service
          </p>
        </div>
        <SettingsInput
          label="Terms title"
          value={state.termsTitle}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "termsTitle",
              value: e.target.value,
            })
          }
          placeholder="Terms of Service"
        />
        <SettingsTextarea
          label="Terms content"
          value={state.termsContent}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "termsContent",
              value: e.target.value,
            })
          }
          rows={3}
          placeholder="Enter terms of service or store rules for customers…"
        />
      </div>

      {/* Privacy Policy Section */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-search-bg/40 p-4">
        <div className="flex items-center gap-2">
          <MaskIcon src="/sidebar/lock.svg" className="size-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Privacy Policy
          </p>
        </div>
        <SettingsInput
          label="Privacy policy title"
          value={state.privacyTitle}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "privacyTitle",
              value: e.target.value,
            })
          }
          placeholder="Privacy Policy"
        />
        <SettingsTextarea
          label="Privacy policy content"
          value={state.privacyContent}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "privacyContent",
              value: e.target.value,
            })
          }
          rows={3}
          placeholder="Enter privacy policy explaining how customer data is handled…"
        />
      </div>

      {/* FAQ Section */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-search-bg/40 p-4">
        <div className="flex items-center gap-2">
          <MaskIcon src="/sidebar/help-desk.svg" className="size-4 text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Frequently Asked Question (Optional)
          </p>
        </div>
        <SettingsInput
          label="Question"
          value={state.faqQuestion}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "faqQuestion",
              value: e.target.value,
            })
          }
          placeholder="Do you offer Cash on Delivery?"
        />
        <SettingsTextarea
          label="Answer"
          value={state.faqAnswer}
          onChange={(e) =>
            dispatch({
              type: "setField",
              field: "faqAnswer",
              value: e.target.value,
            })
          }
          rows={2}
          placeholder="Yes, cash on delivery is available nationwide."
        />
      </div>
    </div>
  );
}
