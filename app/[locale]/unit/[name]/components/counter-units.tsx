import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight } from "lucide-react";
import { AvatarUi } from "@/components/avatar-ui";
import { getUnitNameLine } from "@/lib/units/get-units-from-line";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

type CounterUnitsProps = {
  counterLines: Array<{
    line: string;
    counters: string[];
  }>;
};

export function CounterUnits({ counterLines }: CounterUnitsProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ArrowDownRight className="h-5 w-5" />
          {t("unit.counters")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {counterLines.map((lines, index) => (
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
                        {counter.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
