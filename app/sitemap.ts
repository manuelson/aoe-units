import type { MetadataRoute } from "next";
import { getLineIds } from "@/lib/queries";
import { routing } from "@/i18n/routing";

const BASE = "https://aoeunits.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await getLineIds();

  const pages = routing.locales.flatMap((locale) => [
    { url: `${BASE}/${locale}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE}/${locale}/units`, changeFrequency: "weekly" as const, priority: 0.9 },
  ]);

  const units = routing.locales.flatMap((locale) =>
    ids.map((id) => ({
      url: `${BASE}/${locale}/unit/${id.toLowerCase()}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  // /contribute and /admin are noindex, so they are deliberately absent.
  return [...pages, ...units];
}
