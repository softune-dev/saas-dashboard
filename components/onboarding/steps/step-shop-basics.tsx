"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/session-provider";
import { SettingsInput, SettingsSelect } from "@/components/settings/site/ui/settings-field";
import { MaskIcon } from "@/components/ui/mask-icon";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { updateTenantBusiness, uploadSiteMedia } from "@/lib/api";
import { getSiteSettings, saveSiteBusiness } from "@/lib/api/site-settings";
import { useOnboarding } from "../onboarding-context";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function StepShopBasics() {
  const { currentSite } = useSession();
  const { state, dispatch, registerSaveHandler } = useOnboarding();
  const s = state.draftSettings;

  // These fields are batched into two real writes (tenant identity via
  // updateTenantBusiness, storefront category via saveSiteBusiness) rather
  // than one call per keystroke — the save runs once, right before the
  // wizard advances past this step (see onboarding-context's continueOrSkip).
  useEffect(() => {
    registerSaveHandler(async () => {
      await updateTenantBusiness({
        legal_name: state.legalBusinessName || undefined,
        trade_name: state.tradeName || undefined,
        tin: state.taxId || undefined,
        trade_license: state.tradeLicenseNo || undefined,
      });
      if (currentSite?.id && state.shopCategory) {
        // business.type is the one real field this "shop category" question
        // maps to — patchSite replaces the whole `business` object, so the
        // rest of it has to be re-sent, not just the changed key.
        const settings = await getSiteSettings(currentSite.id);
        await saveSiteBusiness(currentSite.id, {
          ...settings.business,
          type: state.shopCategory,
        });
      }
    });
    return () => registerSaveHandler(null);
  }, [
    registerSaveHandler,
    currentSite?.id,
    state.legalBusinessName,
    state.tradeName,
    state.taxId,
    state.tradeLicenseNo,
    state.shopCategory,
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/shop-bag.svg" className="size-4 text-primary" />
        Shop identity
      </div>

      {/* Rectangular Logo Upload */}
      <MediaSourceMenu
        siteId={currentSite?.id ?? null}
        category="other"
        onUploadFiles={async (files) => {
          if (files[0]) {
            if (currentSite?.id) {
              const uploaded = await uploadSiteMedia(currentSite.id, files[0], "other");
              dispatch({
                type: "patchSettings",
                patch: { logoImage: uploaded.url, logoType: "image" },
              });
            } else {
              const url = URL.createObjectURL(files[0]);
              dispatch({
                type: "patchSettings",
                patch: { logoImage: url, logoType: "image" },
              });
            }
          }
        }}
        onPickImages={(images) => {
          if (images[0]) {
            dispatch({
              type: "patchSettings",
              patch: { logoImage: images[0].url, logoType: "image" },
            });
          }
        }}
      >
        {(open) => (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={open}
              aria-label="Upload shop logo"
              className="group relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-search-bg text-xl font-semibold text-muted shadow-sm transition-all hover:border-primary/50 hover:bg-surface"
            >
              {s.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoImage} alt="Logo" className="size-full object-contain p-2" />
              ) : s.siteName ? (
                initials(s.siteName)
              ) : (
                <MaskIcon src="/sidebar/shop-bag.svg" className="size-10 text-muted-soft" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-2 rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                  <MaskIcon src="/sidebar/edit.svg" className="size-4" />
                  Change logo
                </span>
              </span>
            </button>
            <span className="text-[11px] font-medium text-muted">(click to upload)</span>
          </div>
        )}
      </MediaSourceMenu>

      <SettingsInput
        label="Shop name"
        value={s.siteName}
        onChange={(e) =>
          dispatch({ type: "patchSettings", patch: { siteName: e.target.value } })
        }
        placeholder="e.g. Acme Corporation"
      />

      <SettingsSelect
        label="Shop category / niche"
        value={state.shopCategory}
        onChange={(e) =>
          dispatch({ type: "setField", field: "shopCategory", value: e.target.value })
        }
        options={[
          { value: "", label: "Select category..." },
          { value: "fashion", label: "Fashion & Apparel" },
          { value: "electronics", label: "Electronics & Gadgets" },
          { value: "food", label: "Food & Grocery" },
          { value: "beauty", label: "Beauty & Personal Care" },
          { value: "home", label: "Home & Living" },
          { value: "services", label: "Services" },
          { value: "other", label: "Other" },
        ]}
      />

      <SettingsInput
        label="Tagline"
        value={s.tagline}
        onChange={(e) =>
          dispatch({ type: "patchSettings", patch: { tagline: e.target.value } })
        }
        placeholder="A short line about your brand"
      />

      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/account.svg" className="size-4 text-primary" />
        Business details
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-border bg-search-bg/40 p-4">
        <SettingsInput
          label="Legal business name *"
          value={state.legalBusinessName || ""}
          onChange={(e) =>
            dispatch({ type: "setField", field: "legalBusinessName", value: e.target.value })
          }
          placeholder="e.g. Acme Holdings Ltd."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsInput
            label="Trade / brand name"
            value={state.tradeName || ""}
            onChange={(e) =>
              dispatch({ type: "setField", field: "tradeName", value: e.target.value })
            }
            placeholder="e.g. Acme Store"
          />
          <SettingsInput
            label="TIN / VAT number"
            value={state.taxId || ""}
            onChange={(e) =>
              dispatch({ type: "setField", field: "taxId", value: e.target.value })
            }
            placeholder="e.g. 123456789"
          />
        </div>

        <SettingsInput
          label="Trade license no."
          value={state.tradeLicenseNo || ""}
          onChange={(e) =>
            dispatch({ type: "setField", field: "tradeLicenseNo", value: e.target.value })
          }
          placeholder="e.g. TR-2023-XXXX"
        />
      </div>
    </div>
  );
}
