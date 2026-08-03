import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function ContributeCta() {
  const t = await getTranslations();

  return (
    <section className="cta-dock z-30 border-t border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:py-5 sm:pb-5">
        <div className="max-w-xl">
          <h2 className="text-sm font-semibold tracking-tight sm:text-xl">
            {t("contribute.title")}
          </h2>
          {/* The pitch is dead weight on a phone-width bar; the button already says what it does. */}
          <p className="mt-2 hidden text-sm text-muted-foreground sm:block">{t("contribute.sub")}</p>
        </div>
        <Link
          href="/contribute"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-2.5"
        >
          {t("contribute.title")}
        </Link>
      </div>
    </section>
  );
}
