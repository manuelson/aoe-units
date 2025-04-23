import { aoeDataInternal } from "../db/aoe-data";
import { unitsInternal } from "../db/units-internals";

export function getUnitName(unit: string, language: string = "es"): string {
  const unitName = unitsInternal[unit as keyof typeof unitsInternal];

  if (!unitName) {
    return "Unit not found";
  }

  const unitDataId =
    aoeDataInternal.data.units[unitName.dataId]?.LanguageNameId;

  if (!unitDataId) {
    return "Unit data not found";
  }

  try {
    const translations = importTranslations(language);
    return translations[unitDataId] || "Translation not found";
  } catch (error) {
    console.error(
      `Error loading translations for language "${language}":`,
      error
    );
    return "Translation error";
  }
}

function importTranslations(language: string): Record<string, string> {
  try {
    return require(`./translations/${language}/strings.json`); // eslint-disable-line
  } catch {
    throw new Error(`Translations for language "${language}" not found`);
  }
}
