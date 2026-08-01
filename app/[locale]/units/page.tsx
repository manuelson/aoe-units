import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLines, getCivilizations } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { UnitGrid } from "@/components/unit-grid";
import { Footer } from "@/components/footer";
import { alternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  // No openGraph block on purpose: declaring one here would replace the layout's, which is
  // what carries the /[locale]/opengraph-image card. Next fills og:title and og:description
  // from the fields below anyway.
  return {
    // Not browse.title: that string is the on-page heading ("Todas las unidades del juego"),
    // which carries no keyword anyone searches for. absolute, because the locale layout has
    // already consumed the "%s | AoeUnits" template so the suffix would not be appended here.
    title: { absolute: t("seo.unitsTitle") },
    description: t("seo.unitsDescription"),
    alternates: alternates(locale, "/units"),
  };
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [lines, civs, t] = await Promise.all([
    getLines(locale),
    getCivilizations(),
    getTranslations({ locale }),
  ]);

  return (
    <>
      <SiteHeader lines={lines} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("browse.title")}
        </h1>
        <Suspense fallback={null}>
          <UnitGrid lines={lines} civs={civs} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
