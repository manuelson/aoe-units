import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAuthed } from "@/lib/admin-auth";
import { getAdminLines, getLineForAdmin } from "@/lib/admin-queries";
import { getCivilizations } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SignInPage } from "../../admin-shell";
import { UnitEditor } from "./unit-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit unit",
  robots: { index: false, follow: false },
};

export default async function AdminUnitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!(await isAuthed())) return <SignInPage />;

  const t = await getTranslations({ locale });
  // getAdminLines does double duty: the counter picker needs it anyway, and it resolves
  // the neighbour names that getLineForAdmin deliberately does not fetch.
  const [line, lines, civs] = await Promise.all([
    getLineForAdmin(id),
    getAdminLines(locale),
    getCivilizations(),
  ]);

  if (!line) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-sm text-muted-foreground">{t("admin.notFound")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-10">
        <UnitEditor line={line} lines={lines} civs={civs} />
      </main>
    </>
  );
}
