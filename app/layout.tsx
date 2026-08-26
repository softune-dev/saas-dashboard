import type { Metadata } from "next";
import {
  Archivo_Black,
  Big_Shoulders,
  Bodoni_Moda,
  Cormorant,
  DM_Sans,
  DM_Serif_Display,
  Figtree,
  Fraunces,
  Geist,
  Geist_Mono,
  Google_Sans,
  Instrument_Serif,
  Inter,
  Karla,
  Libre_Baskerville,
  Manrope,
  Newsreader,
  Nunito_Sans,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Prata,
  Sora,
  Space_Grotesk,
  Spectral,
  Urbanist,
  Work_Sans,
} from "next/font/google";
import { DashboardShell } from "@/components/layout";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Google's face for Latin + Bangla in the AI chat drawer (mixed EN/BN replies).
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "bengali"],
  weight: ["400", "500", "600", "700"],
});

// Preview faces for the theme editor's font pickers — same families Aurora
// loads via next/font, so merchants see the real typeface on each option.
const previewFraunces = Fraunces({
  variable: "--font-preview-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewPlayfair = Playfair_Display({
  variable: "--font-preview-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewCormorant = Cormorant({
  variable: "--font-preview-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewInter = Inter({
  variable: "--font-preview-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewManrope = Manrope({
  variable: "--font-preview-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewWorkSans = Work_Sans({
  variable: "--font-preview-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewLibreBaskerville = Libre_Baskerville({
  variable: "--font-preview-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const previewDmSerifDisplay = DM_Serif_Display({
  variable: "--font-preview-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
});
const previewSpectral = Spectral({
  variable: "--font-preview-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewOutfit = Outfit({
  variable: "--font-preview-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewKarla = Karla({
  variable: "--font-preview-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewSora = Sora({
  variable: "--font-preview-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewBodoniModa = Bodoni_Moda({
  variable: "--font-preview-bodoni-moda",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewNewsreader = Newsreader({
  variable: "--font-preview-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewInstrumentSerif = Instrument_Serif({
  variable: "--font-preview-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});
const previewPrata = Prata({
  variable: "--font-preview-prata",
  subsets: ["latin"],
  weight: ["400"],
});
const previewArchivoBlack = Archivo_Black({
  variable: "--font-preview-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
});
const previewBigShouldersDisplay = Big_Shoulders({
  variable: "--font-preview-big-shoulders-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewPlusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-preview-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewSpaceGrotesk = Space_Grotesk({
  variable: "--font-preview-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewUrbanist = Urbanist({
  variable: "--font-preview-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewFigtree = Figtree({
  variable: "--font-preview-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewDmSans = DM_Sans({
  variable: "--font-preview-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const previewNunitoSans = Nunito_Sans({
  variable: "--font-preview-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Softune Dashboard",
  description: "Softune admin dashboard",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
  // Authenticated admin panel — nothing here is meant for search results,
  // and a login screen (or worse, a tenant subdomain reference) showing up
  // in Google is a real leak, not just wasted crawl budget.
  robots: { index: false, follow: false },
  // Opts out of the Dark Reader extension — a documented tag it respects
  // (https://github.com/darkreader/darkreader#how-to-opt-out-a-website).
  // The dashboard already ships its own dark theme, so Dark Reader has
  // nothing useful to add here; it was observed force-repainting the
  // product description's rich-text (contenteditable) editor on every
  // keystroke/mutation, which froze the tab. This tag prevents Dark Reader
  // from touching the page at all, for every visitor who has it installed.
  other: {
    "darkreader-lock": "",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        geistSans.variable,
        geistMono.variable,
        googleSans.variable,
        previewFraunces.variable,
        previewPlayfair.variable,
        previewCormorant.variable,
        previewInter.variable,
        previewManrope.variable,
        previewWorkSans.variable,
        previewLibreBaskerville.variable,
        previewDmSerifDisplay.variable,
        previewSpectral.variable,
        previewOutfit.variable,
        previewKarla.variable,
        previewSora.variable,
        previewBodoniModa.variable,
        previewNewsreader.variable,
        previewInstrumentSerif.variable,
        previewPrata.variable,
        previewArchivoBlack.variable,
        previewBigShouldersDisplay.variable,
        previewPlusJakartaSans.variable,
        previewSpaceGrotesk.variable,
        previewUrbanist.variable,
        previewFigtree.variable,
        previewDmSans.variable,
        previewNunitoSans.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full font-sans">
        <Providers>
          <DashboardShell>{children}</DashboardShell>
        </Providers>
      </body>
    </html>
  );
}
