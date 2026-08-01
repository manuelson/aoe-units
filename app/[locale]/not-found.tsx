import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// notFound() from a /es route used to land on app/not-found.tsx, which renders its own
// <html lang="en"> with English copy. This boundary sits inside the locale layout, so the
// 404 keeps the language the visitor was already browsing in.
// params are not available in not-found.tsx — the locale comes from the layout's request
// context, which is why this reads translations instead of taking a locale prop.
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("body")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/units"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("browse")}
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
