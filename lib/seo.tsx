import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE = "https://aoeunits.com";

/**
 * Canonical + hreflang set for one page. `path` is locale-agnostic ("" or "/units"),
 * so every localised twin of a page points at the same alternate group.
 */
export function alternates(locale: string, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}

/**
 * Shared openGraph base. Next replaces the whole `openGraph` object per segment instead
 * of deep-merging it, so a page that sets only `{ locale }` silently drops siteName and
 * type. Every page spreads this instead of relying on inheritance.
 * `title`/`description` are omitted on purpose — Next fills them from the page metadata.
 */
export function og(
  locale: string,
  rest?: Metadata["openGraph"]
): Metadata["openGraph"] {
  return { type: "website", siteName: "AoeUnits", locale, ...rest };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
