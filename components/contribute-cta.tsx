import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function ContributeCta() {
  const t = await getTranslations();

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight">{t("contribute.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("contribute.sub")}</p>
        </div>
        <Link
          href="/contribute"
          className="shrink-0 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
        >
          {t("contribute.title")}
        </Link>
      </div>
    </section>
  );
}
