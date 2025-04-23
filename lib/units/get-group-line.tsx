import { getUnitName } from "./get-unit-name";

export const getGroupLine = (
  unitsIds: { units: string[]; civ: string }[],
  locale = "en"
) => {
  const result: Array<Array<{ name: string; avatar: string; civ: string }>> =
    [];

  unitsIds.map((units) => {
    result.push(
      units.units.map((u: string) => {
        return {
          name: getUnitName(u, locale),
          avatar: u,
          civ: units.civ,
        };
      })
    );
  });

  return result;
};
