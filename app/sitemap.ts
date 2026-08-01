import type { MetadataRoute } from "next";
import { getLineIds } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/seo";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** Every locale gets its own <url> carrying the full alternate set, per Google's hreflang spec. */
function localised(path: string, rest: Omit<Entry, "url">): Entry[] {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE}/${l}${path}`])
  );
  return routing.locales.map((locale) => ({
    url: `${SITE}/${locale}${path}`,
    alternates: { languages },
    ...rest,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await getLineIds();

  // No lastModified: nothing in the schema tracks per-row edits, and a lastmod that is
  // really the build time on every URL is one Google learns to ignore.
  // /contribute and /admin are noindex, so they are deliberately absent.
  return [
    ...localised("", { changeFrequency: "weekly", priority: 1 }),
    ...localised("/units", { changeFrequency: "weekly", priority: 0.9 }),
    ...ids.flatMap((id) =>
      localised(`/unit/${id.toLowerCase()}`, {
        changeFrequency: "monthly",
        priority: 0.7,
      })
    ),
  ];
}
