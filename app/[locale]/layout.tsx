import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, themeScript } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { SearchHistoryProvider } from "@/context/search-history";
import { og } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// app/layout.tsx owns the site-wide block (metadataBase, robots, OG defaults).
// This one only adds what is locale-specific — it used to hardcode English strings,
// so every Spanish page shipped an English title and description.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("seo.homeTitle"),
    description: t("seo.homeDescription"),
    openGraph: og(locale, { description: t("seo.homeDescription") }),
    keywords: [
      "Age of Empires II",
      "aoe2 counters",
      "counter units",
      "aoe2 unit counters",
      "aoeunits",
    ],
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  // Without this next-intl falls back to the dynamic request API, which opts every
  // page out of static rendering even when generateStaticParams is present.
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Server-rendered only, so React never tries to run it during a client render. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider>
          <ThemeProvider>
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
