import { getCounters, getUnitNameLine } from "@/lib/units/get-units-from-line";
import { unitLineIds } from "@/lib/db/units-ids";
import { getUnitName } from "@/lib/units/get-unit-name";
import { getUnitsFromLine } from "@/lib/units/get-units";
import type { MetadataRoute } from "next";

function getAoeData(locale = "en") {
  const finalData = [];
  for (const unitLine of unitLineIds) {
    finalData.push({
      name: getUnitNameLine(unitLine, locale),
      avatar: unitLine,
      units: getUnitsFromLine(unitLine).map((unit) =>
        getUnitName(unit, locale)
      ),
      counters: getCounters(unitLine),
      id: unitLine,
    });
  }
  return finalData;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = "en";
  // take only with counters
  const suggestions = getAoeData(locale)
    .filter(
      (suggestion) => suggestion.counters && suggestion.counters.length > 0
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return suggestions.map((suggestion) => ({
    url: `https://aoeunits.com/unit/${suggestion.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));
}
