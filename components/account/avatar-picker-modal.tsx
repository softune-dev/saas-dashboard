"use client";

import { Check, Upload } from "lucide-react";
import { useState } from "react";
import { MediaSourceMenu } from "@/components/media/media-source-menu";
import { SettingsModal } from "@/components/settings/site/ui/settings-modal";
import { useToast } from "@/components/ui/toast";
import { uploadSiteMedia, type MediaImage } from "@/lib/api";
import { PRESET_AVATARS } from "@/lib/preset-avatars";

type AvatarPickerModalProps = {
  open: boolean;
  onClose: () => void;
  currentUrl: string | null;
  /** Real site to upload/browse against — device upload and "Choose from
   * Media" need a site's Cloudinary folder to live in (there's no
   * user-level media route). Presets always work with no site at all. */
  siteId: string | null;
  onSelect: (url: string) => Promise<void>;
};

/** Three ways to set a profile picture: pick one of 8 generated preset
 * avatars, upload a photo from device, or reuse something already in the
 * site's media library — same "Upload from device" / "Choose from Media"
 * choice every other image field in the dashboard already offers. */
export function AvatarPickerModal({
  open,
  onClose,
  currentUrl,
  siteId,
  onSelect,
}: AvatarPickerModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSelect(url: string) {
    setSaving(url);
    try {
      await onSelect(url);
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't update avatar",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(null);
    }
  }

  async function handleUpload(files: FileList) {
    const file = files[0];
    if (!file || !siteId) return;
    setSaving("upload");
    try {
      const uploaded = await uploadSiteMedia(siteId, file, "other");
      await onSelect(uploaded.url);
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't upload avatar",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(null);
    }
  }

  async function handlePick(images: MediaImage[]) {
    const image = images[0];
    if (!image) return;
    await handleSelect(image.url);
  }

  return (
    <SettingsModal open={open} title="Choose a profile picture" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">Preset avatars</p>
          <div className="grid grid-cols-4 gap-2.5">
            {PRESET_AVATARS.map((preset) => {
              const active = currentUrl === preset.url;
              return (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => handleSelect(preset.url)}
                  disabled={!!saving}
                  aria-label={`Use ${preset.color} avatar`}
                  className={[
                    "relative flex aspect-square items-center justify-center overflow-hidden rounded-full transition-all disabled:opacity-50",
                    active ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-80",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.url} alt="" className="size-full" />
                  {active ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="size-5 text-white" strokeWidth={2.5} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {siteId ? (
          <MediaSourceMenu
            siteId={siteId}
            category="other"
            onUploadFiles={handleUpload}
            onPickImages={handlePick}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                disabled={!!saving}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border py-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                <Upload className="size-3.5" strokeWidth={1.75} />
                Upload from device or Media library
              </button>
            )}
          </MediaSourceMenu>
        ) : (
          <p className="border-t border-border pt-4 text-xs text-muted-soft">
            Create a site to upload a photo or pick from your media library.
          </p>
        )}
      </div>
    </SettingsModal>
  );
}
