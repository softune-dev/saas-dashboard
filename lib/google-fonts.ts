/** A large, real Google Fonts catalog (not exhaustive of Google's ~1800, but
 * every serif/sans/slab/display/mono family worth shipping to a merchant),
 * so Heading and Body pickers aren't limited to the dozen we happened to
 * next/font-preload. Loaded on demand via the Google Fonts CSS API — see
 * ensureGoogleFont() — rather than needing a static import per family like
 * next/font does, so "any of these" costs nothing until actually picked. */
export const GOOGLE_FONTS: string[] = [
  // Already next/font-preloaded curated set (kept first/duplicated here so
  // the search list is a single source of truth) — serif/display
  "Fraunces", "Playfair Display", "Cormorant", "Libre Baskerville",
  "DM Serif Display", "Spectral", "Bodoni Moda", "Newsreader",
  "Instrument Serif", "Prata", "Archivo Black", "Big Shoulders Display",
  // ...and sans/body
  "Inter", "Manrope", "Work Sans", "Outfit", "Karla", "Sora",
  "Plus Jakarta Sans", "Space Grotesk", "Urbanist", "Figtree", "DM Sans",
  "Nunito Sans",
  // Additional serif / editorial
  "Merriweather", "Lora", "PT Serif", "Crimson Text", "Crimson Pro",
  "Source Serif 4", "Domine", "Bitter", "Cardo", "EB Garamond",
  "Cormorant Garamond", "Vollkorn", "Alegreya", "Alegreya Sans",
  "Zilla Slab", "Noto Serif", "Frank Ruhl Libre", "Gelasio",
  "Literata", "Spectral SC", "Bree Serif", "Rufina", "Aleo",
  "Cantata One", "Marcellus", "Cinzel", "Cinzel Decorative",
  "Abril Fatface", "Playfair Display SC", "Fjalla One", "Rozha One",
  "Yeseva One", "Unna", "Cormorant Infant", "Cormorant SC",
  "Josefin Slab", "Old Standard TT", "Petrona", "Piazzolla",
  "STIX Two Text", "Faustina", "Gilda Display", "Prociono",
  // Slab / display / condensed
  "Roboto Slab", "Arvo", "Josefin Sans", "Oswald", "Anton",
  "Bebas Neue", "Staatliches", "Passion One", "Alfa Slab One",
  "Righteous", "Rammetto One", "Bungee", "Bungee Shade", "Fredoka",
  "Baloo 2", "Titan One", "Luckiest Guy", "Bangers", "Shrikhand",
  "Chivo", "Barlow Condensed", "Big Shoulders Text", "Teko",
  "Saira Condensed", "Khand", "Squada One",
  // Sans / body-friendly
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Nunito",
  "Rubik", "Mulish", "Raleway", "Barlow", "Heebo", "Hind",
  "Source Sans 3", "IBM Plex Sans", "Noto Sans", "Public Sans",
  "Be Vietnam Pro", "Epilogue", "Sora Condensed", "Jost", "Overpass",
  "Exo 2", "Prompt", "Kanit", "Assistant", "Cabin", "Catamaran",
  "Titillium Web", "Red Hat Display", "Red Hat Text", "Manrope Condensed",
  "Onest", "Geologica", "Schibsted Grotesk", "Hanken Grotesk",
  "Lexend", "Lexend Deca", "Albert Sans", "General Sans", "Sarabun",
  "Yantramanav", "Karla Condensed", "Mukta", "Signika", "Signika Negative",
  // Elegant script / handwriting (headings only, use sparingly)
  "Great Vibes", "Dancing Script", "Pacifico", "Sacramento",
  "Alex Brush", "Allura", "Parisienne", "Tangerine", "Satisfy",
  "Kalam", "Caveat", "Shadows Into Light", "Homemade Apple",
  "Cookie", "Italianno", "Playball", "Mrs Saint Delafield",
  // Monospace (rare for storefronts, occasionally wanted for a techy brand)
  "JetBrains Mono", "Space Mono", "IBM Plex Mono", "Roboto Mono",
  "Source Code Pro", "Fira Code", "Courier Prime",
];

/** Subset of GOOGLE_FONTS that reads well as a heading face — serif/slab/
 * display families only. Deliberately excludes script/handwriting (fine for
 * a single word, not a storefront's H1) and mono, so "randomize" always
 * lands on something that looks intentional rather than novelty. */
export const GOOD_HEADING_FONTS = [
  "Fraunces", "Playfair Display", "Cormorant", "Libre Baskerville",
  "DM Serif Display", "Spectral", "Bodoni Moda", "Newsreader",
  "Prata", "Merriweather", "Lora", "PT Serif", "Crimson Pro",
  "Source Serif 4", "Domine", "Bitter", "EB Garamond",
  "Cormorant Garamond", "Alegreya", "Zilla Slab", "Literata",
  "Marcellus", "Cinzel", "Abril Fatface", "Fjalla One", "Rozha One",
  "Yeseva One", "Josefin Slab", "Piazzolla", "Roboto Slab", "Arvo",
  "Oswald", "Chivo", "Barlow Condensed",
];

/** Subset of GOOGLE_FONTS that reads well as body text at small sizes —
 * plain sans/serif workhorses only, no display or script faces. */
export const GOOD_BODY_FONTS = [
  "Inter", "Manrope", "Work Sans", "Outfit", "Karla", "Sora",
  "Plus Jakarta Sans", "Space Grotesk", "Urbanist", "Figtree",
  "DM Sans", "Nunito Sans", "Roboto", "Open Sans", "Lato",
  "Montserrat", "Poppins", "Nunito", "Rubik", "Mulish", "Raleway",
  "Barlow", "Heebo", "Hind", "Source Sans 3", "IBM Plex Sans",
  "Noto Sans", "Public Sans", "Be Vietnam Pro", "Epilogue", "Jost",
  "Cabin", "Assistant", "Lexend",
];

/** A fresh, tasteful heading+body combo, pulled from the "safe for that
 * role" subsets above rather than the full 162-font list (which also has
 * scripts and mono that make a bad pair on their own). */
export function randomFontPair(): { displayFont: string; bodyFont: string } {
  return {
    displayFont: GOOD_HEADING_FONTS[Math.floor(Math.random() * GOOD_HEADING_FONTS.length)],
    bodyFont: GOOD_BODY_FONTS[Math.floor(Math.random() * GOOD_BODY_FONTS.length)],
  };
}

const loaded = new Set<string>();

/** Injects (once per family, cached across the tab's lifetime) a Google
 * Fonts CSS `<link>` — same mechanism Google's own embed snippet uses.
 * Safe to call every render; only the first call per family touches the
 * DOM. No-op during SSR. */
export function ensureGoogleFont(family: string, weights = "400;500;600;700") {
  if (!family || typeof document === "undefined") return;
  if (loaded.has(family)) return;
  loaded.add(family);

  const href = googleFontHref(family, weights);
  const existing = document.head.querySelector(`link[data-gf="${family}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.gf = family;
  document.head.appendChild(link);
}

export function googleFontHref(family: string, weights = "400;500;600;700") {
  const encoded = encodeURIComponent(family).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`;
}
