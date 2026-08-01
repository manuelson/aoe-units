import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getLine, getLineIds } from "@/lib/queries";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AoeUnits — Age of Empires II counter units";

// Mirrors the page's own params so every card is built once, not on first share.
export async function generateStaticParams() {
  const ids = await getLineIds();
  return routing.locales.flatMap((locale) =>
    ids.map((id) => ({ locale, name: id.toLowerCase() }))
  );
}

export default async function UnitOgImage({
  params,
}: {
  params: Promise<{ name: string; locale: string }>;
}) {
  const { name, locale } = await params;
  const [line, t] = await Promise.all([
    getLine(name, locale),
    getTranslations({ locale }),
  ]);

  const heading = line ? line.name : "AoeUnits";
  const subtitle = line
    ? [t(`class.${line.unitClass}`), line.civ].filter(Boolean).join(" · ")
    : t("seo.homeTitle");
  // Four names is what fits on one line at 32px before it wraps into the padding.
  const counters = line?.counteredBy.slice(0, 4).map((c) => c.name).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#d97706", letterSpacing: -0.5 }}>
          AoeUnits
        </div>
        <div
          style={{
            fontSize: 84,
            marginTop: 20,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {heading}
        </div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#a1a1aa" }}>
          {subtitle}
        </div>
        {counters && (
          <div style={{ display: "flex", fontSize: 32, marginTop: 36 }}>
            <span style={{ color: "#d97706" }}>{t("unit.counters")}:&nbsp;</span>
            <span>{counters}</span>
          </div>
        )}
      </div>
    ),
    size
  );
}
