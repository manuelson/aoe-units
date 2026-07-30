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
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      es: "/es",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "AoeUnits",
    title: "AoeUnits: Age of Empires II counter units",
    description:
      "Explore counter units, upgrades, and lines for Age of Empires II.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "AoeUnits",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AoeUnits: Age of Empires II counter units",
    description:
      "Explore counter units, upgrades, and lines for Age of Empires II.",
    images: ["/og-default.png"],
  },
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
