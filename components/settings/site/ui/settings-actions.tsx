"use client";

import { PrimaryButton } from "@/components/ui/primary-button";
import { OutlineButton } from "@/components/ui/outline-button";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useLanguage } from "@/components/providers/language-provider";

type SettingsActionsProps = {
  saveLabel?: string;
  onSave?: () => void;
  onReset?: () => void;
};

export function SettingsActions({
  saveLabel = "Save changes",
  onSave,
  onReset,
}: SettingsActionsProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border dark:border-transparent pt-4">
      <PrimaryButton type="button" onClick={onSave}>
        <MaskIcon src="/sidebar/save.svg" className="size-4" />
        {t(saveLabel)}
      </PrimaryButton>
      {onReset ? (
        <OutlineButton type="button" onClick={onReset}>
          {t("Reset")}
        </OutlineButton>
      ) : null}
    </div>
  );
}
