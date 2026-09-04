"use client";

import { useLanguage } from "@/components/providers/language-provider";

function FlagBD({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} shrink-0 aspect-square rounded-full overflow-hidden shadow-xs`}
      viewBox="0 0 100 100"
    >
      <rect width="100" height="100" fill="#006A4E" />
      <circle cx="45" cy="50" r="30" fill="#F42A41" />
    </svg>
  );
}

function FlagUK({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} shrink-0 aspect-square rounded-full overflow-hidden shadow-xs`}
      viewBox="0 0 100 100"
    >
      <clipPath id="uk-circle-clip-dash">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath="url(#uk-circle-clip-dash)">
        <rect width="100" height="100" fill="#012169" />
        <path d="M0 0L100 100M100 0L0 100" stroke="#FFFFFF" strokeWidth="14" />
        <path d="M0 0L100 100M100 0L0 100" stroke="#C8102E" strokeWidth="9" />
        <path d="M50 0V100M0 50H100" stroke="#FFFFFF" strokeWidth="22" />
        <path d="M50 0V100M0 50H100" stroke="#C8102E" strokeWidth="13" />
      </g>
    </svg>
  );
}

type LanguageToggleProps = {
  className?: string;
  /** When true, renders short codes ("EN" / "BN") instead of full names ("English" / "বাংলা") */
  short?: boolean;
};

export function LanguageToggle({ className = "", short = false }: LanguageToggleProps) {
  const { locale, toggleLocale } = useLanguage();
  const isBn = locale === "bn";

  const label = isBn ? (short ? "EN" : "English") : (short ? "BN" : "বাংলা");

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground transition-all hover:bg-search-bg",
        className,
      ].join(" ")}
      title={isBn ? "Switch to English" : "বাংলায় দেখুন"}
      aria-label="Toggle language"
    >
      {isBn ? <FlagUK className="size-4" /> : <FlagBD className="size-4" />}
      <span>{label}</span>
    </button>
  );
}
