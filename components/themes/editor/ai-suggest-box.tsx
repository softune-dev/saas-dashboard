"use client";

import { useState } from "react";
import { suggestThemePatch, type AISuggestPatch } from "@/lib/api/ai";

const FIELD_LABELS: Record<string, string> = {
  siteName: "Site name",
  tagline: "Tagline",
  primaryColor: "Primary color",
  accentColor: "Text color",
  surfaceColor: "Surface color",
  displayFont: "Headings font",
  bodyFont: "Body font",
  buttonStyle: "Button style",
};

/**
 * Prompt box embedded directly in the Brand/Colors panels — not the generic
 * chat sidebar. A suggestion never touches the live site until the merchant
 * hits Apply, which just calls the same onChange(patch) every manual field
 * already uses (see PanelFields in editor-sidebar.tsx).
 */
export function AISuggestBox({
  siteId,
  onApply,
}: {
  siteId: string | null;
  onApply: (patch: AISuggestPatch) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patch, setPatch] = useState<AISuggestPatch | null>(null);

  const handleSuggest = async () => {
    if (!siteId || !prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPatch(null);
    try {
      const result = await suggestThemePatch(siteId, prompt.trim());
      if (Object.keys(result).length === 0) {
        setError("No suggestion for that — try describing colors, fonts, or wording.");
      } else {
        setPatch(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!patch) return;
    onApply(patch);
    setPatch(null);
    setPrompt("");
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <img
          src="/sidebar/gemini.svg"
          alt=""
          className="size-3.5 shrink-0"
        />
        Ask AI
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. make it feel warmer, like a bakery"
        rows={2}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={handleSuggest}
        disabled={!siteId || !prompt.trim() || loading}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {loading ? "Thinking…" : "Suggest"}
      </button>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {patch && (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[11px] font-medium text-slate-500">Suggested changes</p>
          <ul className="flex flex-col gap-1">
            {Object.entries(patch).map(([key, value]) => (
              <li key={key} className="flex items-center gap-2 text-xs text-slate-700">
                {key.toLowerCase().includes("color") && (
                  <span
                    className="size-3 shrink-0 rounded-full border border-slate-200"
                    style={{ background: String(value) }}
                  />
                )}
                <span className="font-medium">{FIELD_LABELS[key] ?? key}:</span>
                <span className="truncate text-slate-500">{String(value)}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setPatch(null)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
