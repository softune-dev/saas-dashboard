/**
 * Preset avatar options — a generic silhouette in a solid color circle,
 * same pattern Google/Slack use for a default avatar. Generated as a data:
 * URI client-side (no image assets to ship) so the result is just a plain
 * URL string like any real upload — nothing downstream needs to know a
 * preset was picked instead of a Cloudinary file.
 */
export const PRESET_AVATAR_COLORS = [
  "#FF5A36", // primary
  "#3B82F6", // store blue
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#64748B",
];

export function presetAvatarUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${color}"/>
    <circle cx="50" cy="28" r="14" fill="#ffffff"/>
    <path d="M 28 44 Q 28 46 35 60 L 35 84 L 50 84 L 65 84 L 65 60 Q 72 46 72 44 Q 72 42 50 42 Q 28 42 28 44 Z" fill="#ffffff"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS = PRESET_AVATAR_COLORS.map((color) => ({
  color,
  url: presetAvatarUrl(color),
}));
