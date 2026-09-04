const PALETTE = [
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-emerald-500/15 text-emerald-600",
  "bg-sky-500/15 text-sky-600",
  "bg-violet-500/15 text-violet-600",
  "bg-orange-500/15 text-orange-600",
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

function initials(name: string) {
  const words = name.replace(/[.,]/g, "").split(" ").filter(Boolean);
  return (words[0]?.[0] ?? "").concat(words[1]?.[0] ?? "").toUpperCase();
}

type SupplierLogoProps = {
  name: string;
  logo?: string | null;
  size?: "md" | "lg";
};

/** Store logo, big and beside the name — falls back to a colored initials
 * avatar (deterministic per supplier name) when no image has been uploaded,
 * same convention as avatars elsewhere in the dashboard. */
export function SupplierLogo({ name, logo, size = "md" }: SupplierLogoProps) {
  const dimension = size === "lg" ? "size-14" : "size-11";
  const textSize = size === "lg" ? "text-lg" : "text-sm";

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        className={`${dimension} shrink-0 rounded-full object-cover ring-1 ring-border`}
      />
    );
  }

  return (
    <span
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full font-semibold ${textSize} ${paletteFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
