import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLines, getCivilizations } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { CivShowcase } from "@/components/civ-showcase";
import { CounterTriangle } from "@/components/counter-triangle";
import { UnitGrid } from "@/components/unit-grid";
import { RecentlyViewed } from "@/components/recently-viewed";
import { ContributeCta } from "@/components/contribute-cta";
import { Footer } from "@/components/footer";

export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [lines, civs, t] = await Promise.all([
    getLines(locale),
    getCivilizations(),
    getTranslations({ locale }),
  ]);

  const counterCount = lines.reduce((n, l) => n + l.counterCount, 0);
  const names = Object.fromEntries(lines.map((l) => [l.id, l.name]));

  return (
    <>
      <SiteHeader />
      <main>
        <Hero lines={lines} counterCount={counterCount} />
        <CivShowcase lines={lines} />
        <CounterTriangle names={names} />
        <RecentlyViewed />

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("browse.title")}
          </h2>
          <Suspense fallback={null}>
            <UnitGrid lines={lines} civs={civs} />
          </Suspense>
        </section>

        <ContributeCta />
      </main>
      <Footer />
    </>
  );
}
