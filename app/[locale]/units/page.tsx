import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLines, getCivilizations } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { UnitGrid } from "@/components/unit-grid";
import { Footer } from "@/components/footer";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("browse.title"), alternates: { canonical: `/${locale}/units` } };
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
