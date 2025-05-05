import { useTranslations } from "next-intl";
import { LanguageToggle } from "./language-toggle";
import { SearchBar } from "./search-bar";
import { SearchHistory } from "./search-history";
import { ThemeToggle } from "./theme-toggle";

export const Header = () => {
  const t = useTranslations();
  return (
    <section className="max-w-4xl space-y-8 px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
        <SearchBar placeholder={t("searchPlaceholder")} />
      </div>
      <SearchHistory />
    </section>
  );
};
