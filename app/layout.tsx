import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://aoeunits.com"),
  title: {
    default: "AoeUnits: Age of Empires II counter units",
    template: "%s | AoeUnits",
  },
  description:
    "Explore counter units, upgrades, and lines for Age of Empires II.",
  applicationName: "AoeUnits",
  keywords: [
    "Age of Empires",
    "AoE2",
    "units",
    "counters",
    "upgrades",
    "tech tree",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  // Canonicals and hreflang are per-page (lib/seo.tsx). A site-wide canonical of "/"
  // would have every unit page declaring the homepage as its canonical.
  //
  // openGraph lives in lib/seo.tsx::og() — Next replaces the object per segment rather
  // than merging it, so anything declared here is dropped the moment a page sets its own.
  //
  // twitter carries only the card type: a title/description here would be pinned for the
  // whole site (postProcessMetadata only auto-fills the fields left empty), which is how
  // every Spanish page ended up shipping an English Twitter card.
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// ponytail: passthrough. app/[locale]/layout.tsx renders <html>/<body>
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
