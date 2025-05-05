"use client";
import { useLocale, useTranslations } from "next-intl";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowDownRight } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { useAoeDataById } from "@/data/useAoeData";
import { AvatarUi } from "@/components/avatar-ui";
import { Footer } from "@/components/footer";
import Link from "next/link";
import {
  getUnitNameLine,
  getUnitsFromLine,
} from "@/lib/units/get-units-from-line";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

export default function UnitPageClient() {
  const { name } = useParams<{ name: string }>();
  const t = useTranslations();
  const locale = useLocale();

  const unit = useAoeDataById(name.toLowerCase().trim(), locale);

  if (!unit) {
    notFound();
  }

  return (
    <section className="flex flex-col justify-between items-center pt-5">
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
      <div className="w-full max-w-4xl space-y-8 px-4">
        <div>
          <SearchBar placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <AvatarUi name={unit.name} avatar={unit.avatar} />
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {unit.name} - {t("counter-units")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {getUnitsFromLine(unit.avatar).map(
              (unit, index, array) =>
                array.length > 1 && (
                  <span key={unit}>
                    {getUnitNameLine(unit, locale)}
                    {index < array.length - 1 ? " - " : ""}
                  </span>
                )
            )}
          </p>
        </div>
        <div>
          {/* Counters Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ArrowDownRight className="h-5 w-5" />
                {t("unit.counters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unit.counterLines.map((lines, index) => (
                  <div
                    key={`${index}`}
                    className="gap-3 flex justify-between p-3 items-center bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div>
                      <div className="flex flex-row gap-3 items-center">
                        <AvatarUi
                          name={getUnitNameLine(lines.line, locale)}
                          avatar={lines.line}
                        />
                        {lines.counters.length > 1
                          ? getUnitNameLine(lines.line, locale) +
                            " (" +
                            t("line") +
                            ")"
                          : getUnitNameLine(lines.line, locale)}
                      </div>
                      <div>
                        {lines.counters.length > 1 &&
                          lines.counters.slice(0, -1).map((counter) => (
                            <span
                              key={`${counter}-names`}
                              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all duration-200 ease-in-out"
                            >
                              {getUnitNameLine(counter, locale)},{" "}
                            </span>
                          ))}
                        {lines.counters.length > 1 && (
                          <span className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all duration-200 ease-in-out">
                            {getUnitNameLine(
                              lines.counters[lines.counters.length - 1],
                              locale
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex -space-x-3 *:ring-2 *:ring-background">
                      {lines.counters.length > 1 &&
                        lines.counters.map((counter) => (
                          <Avatar
                            key={counter}
                            className="dark:ring-gray-800 md:w-15 md:h-15 w-10 h-10 transition-transform duration-200 ease-in-out hover:scale-110 hover:z-10"
                          >
                            <AvatarImage
                              src={`/units/${counter}.png`}
                              className="bg-black"
                            />
                            <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </section>
  );
}
