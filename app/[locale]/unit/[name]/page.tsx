import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ShieldAlert, Swords } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getLine, getLineIds, getLines, getStatMaxima } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import { CounterList } from "@/components/counter-list";
import { UnitStats } from "@/components/unit-stats";
import { CounterFeedback } from "@/components/counter-feedback";
import { JsonLd, SITE, alternates, og } from "@/lib/seo";

export const revalidate = 3600;

type PageProps = { params: Promise<{ name: string; locale: string }> };

export async function generateStaticParams() {
  const ids = await getLineIds();
  return routing.locales.flatMap((locale) =>
    ids.map((id) => ({ locale, name: id.toLowerCase() }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name, locale } = await params;
  const line = await getLine(name, locale);
  if (!line) return { title: "Not found", robots: { index: false, follow: false } };

  const t = await getTranslations({ locale });
  // Capped: Skirmisher has 21 counters, and listing them all pushed the description past
  // 400 characters against a ~160 budget. The full list is on the page and in the FAQ block.
  const counters = line.counteredBy.slice(0, 4).map((c) => c.name).join(", ");

  const title = t("seo.unitTitle", { name: line.name });
  const description = counters
    ? t("seo.unitDescription", { name: line.name, counters })
    : t("seo.unitDescriptionEmpty", { name: line.name });

  return {
    // absolute: the " | AoeUnits" template pushed long Spanish names ("Carro de guerra
    // (disparo concentrado)") past 80 characters, and Google cuts around 60.
    title: { absolute: title },
    description,
    // Lowercased: the route is case-insensitive, so /unit/Knight and /unit/knight both
    // resolve and would otherwise be indexed as two pages with the same content.
    alternates: alternates(locale, `/unit/${name.toLowerCase()}`),
    openGraph: og(locale, { title, description, type: "article" }),
  };
}

export default async function UnitPage({ params }: PageProps) {
  const { name, locale } = await params;
  setRequestLocale(locale);
  const [line, allLines, maxima, t] = await Promise.all([
    getLine(name, locale),
    getLines(locale),
    getStatMaxima(),
    getTranslations({ locale }),
  ]);

  if (!line) notFound();

  // Only questions the page actually answers on screen — Google rejects FAQ markup
  // whose answers are not visible, so an empty list means no FAQ block at all.
  const faqs = [
    line.counteredBy.length && {
      q: t("seo.faqCounteredBy", { name: line.name }),
      a: t("seo.faqCounteredByAnswer", {
        name: line.name,
        counters: line.counteredBy.map((c) => c.name).join(", "),
      }),
    },
    line.strongAgainst.length && {
      q: t("seo.faqStrongAgainst", { name: line.name }),
      a: t("seo.faqStrongAgainstAnswer", {
        name: line.name,
        units: line.strongAgainst.map((c) => c.name).join(", "),
      }),
    },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: t("seo.home"), item: `${SITE}/${locale}` },
            { name: t("browse.title"), item: `${SITE}/${locale}/units` },
            { name: line.name, item: `${SITE}/${locale}/unit/${name.toLowerCase()}` },
          ].map((e, i) => ({ "@type": "ListItem", position: i + 1, ...e })),
        }}
      />
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}
      <SiteHeader lines={allLines} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/units"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {t("unit.back")}
        </Link>

        <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Portrait
            id={line.id}
            name={line.name}
            size="xl"
            priority
            alt={`${line.name} — Age of Empires II`}
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {line.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                {t(`class.${line.unitClass}`)}
              </span>
              {line.civ && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-1.5 pr-2.5 text-secondary-foreground">
                  <CivBadge civ={line.civ} size={18} />
                  {line.civ}
                </span>
              )}
              {line.isUnique && (
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">
                  {t("unit.unique")}
                </span>
              )}
            </div>
          </div>
        </header>

        {line.units.length > 1 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("unit.line")}
            </h2>
            <ol className="flex flex-wrap items-center gap-2">
              {line.units.map((u, i) => (
                <li key={u.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted-foreground">→</span>}
                  <span className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3.5 text-sm">
                    <Portrait id={u.id} name={u.name} size="sm" className="h-7 w-7" />
                    {u.name}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {line.stats && (
          <section className="mt-10 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              {t("unit.stats")}
            </h2>
            <UnitStats stats={line.stats} maxima={maxima} />
          </section>
        )}

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ShieldAlert className="h-5 w-5 text-primary" strokeWidth={1.75} />
            {t("unit.counters")}
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{t("unit.countersHelp")}</p>

          {line.counteredBy.length > 0 ? (
            <CounterList lines={line.counteredBy} />
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="font-medium">{t("unit.noCounters")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {t("unit.noCountersBody")}
              </p>
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Swords className="h-5 w-5 text-primary" strokeWidth={1.75} />
            {t("unit.strongAgainst")}
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {t("unit.strongAgainstHelp")}
          </p>

          {line.strongAgainst.length > 0 ? (
            <CounterList lines={line.strongAgainst} />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
              {t("unit.noStrongAgainst")}
            </p>
          )}
        </section>

        <div className="mt-12">
          <CounterFeedback
            lineId={line.id}
            lineName={line.name}
            allLines={allLines}
            listed={line.counteredBy}
            baseUnitId={line.units[0]?.id}
            baseStats={line.stats}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
