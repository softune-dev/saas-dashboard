"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  SettingsInput,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";
import { MaskIcon } from "@/components/ui/mask-icon";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { uploadSiteMedia } from "@/lib/api";
import { saveSiteSeo } from "@/lib/api/site-settings";
import { useOnboarding } from "../onboarding-context";

export function StepSeo() {
  const { currentSite } = useSession();
  const { state, dispatch, registerSaveHandler } = useOnboarding();

  const siteId = currentSite?.id ?? null;
  const [uploadingField, setUploadingField] = useState<"seoOgImage" | "seoFavicon" | null>(null);

  // One PATCH /sites/{id} with the whole seo object, fired right before the
  // wizard moves on — not on every keystroke, to avoid a network call per
  // character typed in the meta description.
  useEffect(() => {
    registerSaveHandler(async () => {
      if (!siteId) return;
      await saveSiteSeo(siteId, {
        title_suffix: state.seoTitleSuffix || undefined,
        meta_description: state.seoDescription || undefined,
        keywords: state.seoKeywords || undefined,
        og_title: state.seoOgTitle || undefined,
        og_description: state.seoOgDescription || undefined,
        og_image: state.seoOgImage || undefined,
        favicon: state.seoFavicon || undefined,
      });
    });
    return () => registerSaveHandler(null);
  }, [
    registerSaveHandler,
    siteId,
    state.seoTitleSuffix,
    state.seoDescription,
    state.seoKeywords,
    state.seoOgTitle,
    state.seoOgDescription,
    state.seoOgImage,
    state.seoFavicon,
  ]);

  async function handleUpload(field: "seoOgImage" | "seoFavicon", file: File) {
    setUploadingField(field);
    try {
      if (siteId) {
        try {
          const uploaded = await uploadSiteMedia(siteId, file, "other");
          dispatch({ type: "setField", field, value: uploaded.url });
        } catch {
          const url = URL.createObjectURL(file);
          dispatch({ type: "setField", field, value: url });
        }
      } else {
        const url = URL.createObjectURL(file);
        dispatch({ type: "setField", field, value: url });
      }
    } finally {
      setUploadingField(null);
    }
  }

  const previewTitle = `${state.seoTitle || state.draftSettings.siteName || "Your shop"}${
    state.seoTitleSuffix ? ` | ${state.seoTitleSuffix}` : ""
  }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/domain.svg" className="size-4 text-primary" />
        Search engine optimization
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Page title"
          value={state.seoTitle}
          onChange={(e) =>
            dispatch({ type: "setField", field: "seoTitle", value: e.target.value })
          }
          placeholder={state.draftSettings.siteName || "Your shop name"}
        />
        <SettingsInput
          label="Title suffix"
          value={state.seoTitleSuffix}
          onChange={(e) =>
            dispatch({ type: "setField", field: "seoTitleSuffix", value: e.target.value })
          }
          placeholder='e.g. "| Buy Online in Bangladesh"'
        />
      </div>

      <SettingsTextarea
        label="Meta description"
        value={state.seoDescription}
        onChange={(e) =>
          dispatch({
            type: "setField",
            field: "seoDescription",
            value: e.target.value,
          })
        }
        rows={3}
        placeholder="One or two sentences about what your store sells."
      />

      <SettingsInput
        label="Keywords"
        value={state.seoKeywords}
        onChange={(e) =>
          dispatch({ type: "setField", field: "seoKeywords", value: e.target.value })
        }
        placeholder="Type your keywords, separated by commas"
      />

      <div className="grid grid-cols-1 gap-4 border-t border-border dark:border-transparent pt-4 sm:grid-cols-2">
        <SettingsInput
          label="Social share title (OG Title)"
          value={state.seoOgTitle}
          onChange={(e) =>
            dispatch({ type: "setField", field: "seoOgTitle", value: e.target.value })
          }
          placeholder="Title when shared on Facebook / WhatsApp"
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Social image (OG Image)</span>
          <div className="flex items-center gap-2">
            {state.seoOgImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.seoOgImage}
                alt=""
                className="size-10 shrink-0 rounded-md border border-border bg-surface object-contain p-1"
              />
            ) : null}
            <MediaSourceMenu
              siteId={siteId}
              category="other"
              onUploadFiles={(files) => {
                if (files[0]) handleUpload("seoOgImage", files[0]);
              }}
              onPickImages={(images) => {
                if (images[0])
                  dispatch({ type: "setField", field: "seoOgImage", value: images[0].url });
              }}
            >
              {(open) => (
                <button
                  type="button"
                  onClick={uploadingField === "seoOgImage" ? undefined : open}
                  disabled={uploadingField === "seoOgImage"}
                  aria-busy={uploadingField === "seoOgImage"}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-search-bg text-xs font-medium text-muted transition-colors hover:border-slate-400 disabled:cursor-wait disabled:opacity-70"
                >
                  {uploadingField === "seoOgImage" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                      Uploading…
                    </>
                  ) : state.seoOgImage ? (
                    "Replace image"
                  ) : (
                    "Add social image"
                  )}
                </button>
              )}
            </MediaSourceMenu>
            {state.seoOgImage ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "setField", field: "seoOgImage", value: "" })}
                aria-label="Remove image"
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <SettingsTextarea
        label="Social description (OG Description)"
        value={state.seoOgDescription}
        onChange={(e) =>
          dispatch({ type: "setField", field: "seoOgDescription", value: e.target.value })
        }
        rows={2}
        placeholder="Description when shared on social platforms"
      />

      <div className="flex flex-col gap-1.5 border-t border-border dark:border-transparent pt-4">
        <span className="text-sm font-medium text-muted">Favicon</span>
        <div className="flex items-center gap-2">
          {state.seoFavicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.seoFavicon}
              alt=""
              className="size-10 shrink-0 rounded-md border border-border bg-surface object-contain p-1"
            />
          ) : null}
          <MediaSourceMenu
            siteId={siteId}
            category="other"
            onUploadFiles={(files) => {
              if (files[0]) handleUpload("seoFavicon", files[0]);
            }}
            onPickImages={(images) => {
              if (images[0])
                dispatch({ type: "setField", field: "seoFavicon", value: images[0].url });
            }}
          >
            {(open) => (
              <button
                type="button"
                onClick={uploadingField === "seoFavicon" ? undefined : open}
                disabled={uploadingField === "seoFavicon"}
                aria-busy={uploadingField === "seoFavicon"}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-search-bg text-xs font-medium text-muted transition-colors hover:border-slate-400 disabled:cursor-wait disabled:opacity-70"
              >
                {uploadingField === "seoFavicon" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                    Uploading…
                  </>
                ) : state.seoFavicon ? (
                  "Replace favicon"
                ) : (
                  "Upload favicon"
                )}
              </button>
            )}
          </MediaSourceMenu>
          {state.seoFavicon ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "setField", field: "seoFavicon", value: "" })}
              aria-label="Remove favicon"
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <MaskIcon src="/sidebar/delete.svg" className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl bg-search-bg p-4 border border-border">
        <p className="text-xs font-medium text-muted mb-1">Google Search Result Preview</p>
        <p className="truncate text-sm font-semibold text-primary">{previewTitle}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
          {state.seoDescription || "No meta description set yet."}
        </p>
      </div>
    </div>
  );
}
