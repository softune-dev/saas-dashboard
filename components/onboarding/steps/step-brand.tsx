"use client";

import { useSession } from "@/components/providers/session-provider";
import { AISuggestBox } from "@/components/themes/editor/ai-suggest-box";
import {
  ColorRoleCard,
  EditorField,
  FontPicker,
  PaletteGrid,
} from "@/components/themes/editor/editor-field";
import { getColorPalettes } from "@/components/themes/editor/editor-defaults";
import {
  bodyFontOptions,
  displayFontOptions,
  primarySwatches,
  surfaceSwatches,
  textSwatches,
} from "@/components/themes/editor/editor-types";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useOnboarding } from "../onboarding-context";

export function StepBrand() {
  const { currentSite } = useSession();
  const { state, dispatch } = useOnboarding();
  const s = state.draftSettings;
  const themePalettes = getColorPalettes(state.templateKey);

  const onChange = (patch: Record<string, string>) => {
    dispatch({ type: "patchSettings", patch });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/color.svg" className="size-4 text-primary" />
        Colors and fonts
      </div>

      <AISuggestBox
        siteId={currentSite?.id ?? null}
        onApply={(patch) => onChange(patch as Record<string, string>)}
      />

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium text-muted">Palettes</p>
        <PaletteGrid
          palettes={themePalettes}
          current={{
            primaryColor: s.primaryColor,
            accentColor: s.accentColor,
            surfaceColor: s.surfaceColor,
          }}
          onApply={(patch) => onChange(patch)}
        />
      </div>

      <ColorRoleCard
        label="Primary"
        description="Buttons and accents"
        value={s.primaryColor}
        swatches={primarySwatches}
        onChange={(v) => onChange({ primaryColor: v })}
      />
      <ColorRoleCard
        label="Text"
        description="Headings and body ink"
        value={s.accentColor}
        swatches={textSwatches}
        onChange={(v) => onChange({ accentColor: v })}
      />
      <ColorRoleCard
        label="Surface"
        description="Page background"
        value={s.surfaceColor}
        swatches={surfaceSwatches}
        onChange={(v) => onChange({ surfaceColor: v })}
        tone="dark"
      />

      <EditorField label="Headings font">
        <FontPicker
          value={s.displayFont}
          options={displayFontOptions}
          onChange={(v) => onChange({ displayFont: v })}
        />
      </EditorField>
      <EditorField label="Body text">
        <FontPicker
          value={s.bodyFont}
          options={bodyFontOptions}
          onChange={(v) => onChange({ bodyFont: v })}
        />
      </EditorField>
    </div>
  );
}
