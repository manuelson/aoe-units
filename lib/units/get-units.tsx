import { unitLines } from "../db/units-lines";
import type { Unit, UnitLine } from "./type";

export function getUnitsFromLine(line: string): Unit[] {
  const unitLine = unitLines[line] as UnitLine;

  if (!unitLine) {
    return [];
  }

  return unitLine.units;
}

export function getUnitsFromLines(line: string[]): Unit[] {
  // iterate line and save units into array
  const units: Unit[] = [];
  line.forEach((line) => {
    const unitLine = unitLines[line] as UnitLine;

    if (!unitLine) {
      return;
    }

    units.push(...unitLine.units);
  });
  return units;
}
