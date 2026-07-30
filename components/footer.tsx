import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{t("footer", { year: new Date().getFullYear() })}</p>

        <nav className="flex gap-5">
          <Link href="/units" className="hover:text-foreground">
            {t("unit.back")}
          </Link>
          <Link href="/contribute" className="hover:text-foreground">
            {t("contribute.title")}
          </Link>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        <p className="text-xs text-muted-foreground">
          Created under Microsoft&apos;s{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://www.xbox.com/en-us/developers/rules"
          >
            Game Content Usage Rules
          </a>{" "}
          using assets from Age of Empires II.
        </p>
      </div>
    </footer>
  );
};
