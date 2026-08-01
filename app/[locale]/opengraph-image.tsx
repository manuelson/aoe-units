import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Lives under [locale], not at the app root: the locale layout declares its own openGraph
// object, and Next replaces that object per segment instead of merging it — a card sitting
// at the root is dropped before it reaches any page, which is why sharing the home page
// produced no image at all.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AoeUnits — Age of Empires II counter units";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

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
        <div style={{ fontSize: 34, color: "#d97706", letterSpacing: -0.5 }}>
          AoeUnits
        </div>
        <div style={{ fontSize: 76, marginTop: 24, lineHeight: 1.1, letterSpacing: -2 }}>
          {t("seo.ogTagline")}
        </div>
        <div style={{ fontSize: 32, marginTop: 32, color: "#a1a1aa" }}>
          {t("seo.ogSubtitle")}
        </div>
      </div>
    ),
    size
  );
}
