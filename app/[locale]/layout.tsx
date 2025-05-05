import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider, useLocale } from "next-intl";
import type { Metadata } from "next";
import "../globals.css";
import { SearchHistoryProvider } from "@/context/search-history";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aoe units",
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
    title: "AoeUnits",
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
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SearchHistoryProvider>
              {children}
              <Analytics />
            </SearchHistoryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
