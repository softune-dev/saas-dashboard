import { PrimaryButton } from "@/components/ui/primary-button";
import { OutlineButton } from "@/components/ui/outline-button";
import { MaskIcon } from "@/components/ui/mask-icon";

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
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border dark:border-transparent pt-4">
      <PrimaryButton type="button" onClick={onSave}>
        <MaskIcon src="/sidebar/save.svg" className="size-4" />
        {saveLabel}
      </PrimaryButton>
      {onReset ? (
        <OutlineButton type="button" onClick={onReset}>
          Reset
        </OutlineButton>
      ) : null}
    </div>
  );
}
