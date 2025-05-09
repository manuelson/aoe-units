import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { useLocale } from "next-intl";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aoe units: find the best counter units in Age of Empires II",
  description: "Search and discover Age of Empires II counter units",
  icons: {
    icon: "/icon.png",
  },
  keywords: [
    "Age of Empires II",
    "Counter Units",
    "Units",
    "Units Counter",
    "aoe units",
    "aoe2",
    "aoe2 units",
    "aoe2 counters",
    "aoe2 counter units",
    "aoe2 counter",
    "aoe2 counter units",
    "units",
    "units counter",
    "units counter units",
    "units counter",
    "units counter units",
    "units counter",
    "units counter units",
    "aoeunits",
    "aoeunits.com",
  ],
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      nocache: true,
    },
  },
  authors: [{ name: "AoeUnits", url: "https://aoeunits.com" }],
  generator: "AoeUnits",
  applicationName: "AoeUnits",
  category: "Games",
  creator: "AoeUnits",
  publisher: "AoeUnits",
  openGraph: {
    title: "AoeUnits: find the best counter units in Age of Empires II",
    description: "Search and discover Age of Empires II counter units",
    url: "https://aoeunits.com",
    siteName: "AoeUnits",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();

  return (
    <html lang={locale}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
