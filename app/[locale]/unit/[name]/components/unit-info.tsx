import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AvatarUi } from "@/components/avatar-ui";
import {
  getUnitNameLine,
  getUnitsFromLine,
} from "@/lib/units/get-units-from-line";

type UnitInfoProps = {
  unit: {
    name: string;
    avatar: string;
  };
};

export function UnitInfo({ unit }: UnitInfoProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div>
      <div className="flex items-center gap-2">
        <AvatarUi name={unit.name} avatar={unit.avatar} w="w-15" h="h-15" />
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
  );
}
