import { unitLines, unitLinesType } from "../db/units-lines";
import { getUnitName } from "./get-unit-name";

export function getUnitNameLine(unitLine: string, locale: string): string {
  const units = unitLines[unitLine as keyof typeof unitLines];

  if (units && units.units.length > 1) {
    return `${getUnitName(unitLine, locale)}`;
  }

  return getUnitName(unitLine, locale);
}

export function getUnitsFromLine(unitLine: string) {
  const units = unitLines[unitLine as keyof typeof unitLines];

  if (!units) {
    return [];
  }

  return units.units;
}

export function getCounters(unitLine: string) {
  const units = unitLines[unitLine as keyof typeof unitLines];

  if (units.counteredBy && units.counteredBy.length > 0) {
    return units.counteredBy;
  }

  return [];
}

export function getUnitObject(
  unitLine: string,
  params: {
    counteredBy?: boolean;
    units?: boolean;
  }
): unitLinesType[keyof unitLinesType] | string[] | [] {
  const units = unitLines[unitLine as keyof typeof unitLines];

  if (!units) {
    return [];
  }

  if (params) {
    if (params.counteredBy) {
      return units.counteredBy || [];
    }

    if (params.units) {
      return units.units;
    }
  }

  return units;
}
