import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useLocale } from "next-intl";

export function UnitHeader() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="w-full max-w-4xl space-y-8 px-4 flex justify-between">
      <Link href={`/${locale}`} className="flex items-center justify-between">
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          {t("title")}
        </div>
      </Link>
      <div className="flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
