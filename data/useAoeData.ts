import {
  getCounters,
  getUnitNameLine,
  getUnitObject,
  getUnitsFromLine,
} from "@/lib/units/get-units-from-line";
import { unitLineIds } from "@/lib/db/units-ids";
import { getUnitName } from "@/lib/units/get-unit-name";
import type { Suggestion } from "@/components/search-bar";

export const useAoeData = (locale = "en") => {
  const finalData: Suggestion[] = [];
  unitLineIds.map((unitLine) => {
    finalData.push({
      name: getUnitNameLine(unitLine, locale),
      avatar: unitLine,
      units: getUnitsFromLine(unitLine).map((unit) =>
        getUnitName(unit, locale)
      ),
      counters: getCounters(unitLine),
      id: unitLine,
    });
  });

  return finalData.flat();
};

export const useAoeDataById = (unitId: string, locale = "en") => {
  const unitLine = unitLineIds.find((u) => u.toLowerCase() === unitId);

  if (!unitLine) {
    return null;
  }

  const counterUnitsLines = getUnitObject(unitLine, { counteredBy: true });
  const counterLines: {
    line: string;
    counters: string[];
  }[] = [];

  if (Array.isArray(counterUnitsLines)) {
    counterUnitsLines.map((line: string) => {
      const counters = getUnitObject(line, { units: true });
      if (Array.isArray(counters)) {
        counterLines.push({
          line: line,
          counters: counters,
        });
      }
    });
  }

  return {
    name: getUnitNameLine(unitLine, locale),
    avatar: unitLine,
    counterLines: counterLines,
  };
};
