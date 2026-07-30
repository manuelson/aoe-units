import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLines, getCivilizations } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { ContributeForm } from "./contribute-form";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  // Submission pages have no search value and would dilute the unit pages.
  return { title: t("contribute.title"), robots: { index: false, follow: true } };
}

export default async function ContributePage({
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
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/units"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {t("contribute.back")}
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight">{t("contribute.title")}</h1>
        <p className="mb-10 mt-2 text-muted-foreground">{t("contribute.sub")}</p>

        <ContributeForm lines={lines} civs={civs} />
      </main>
      <Footer />
    </>
  );
}
