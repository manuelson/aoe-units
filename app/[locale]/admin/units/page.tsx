import type { Metadata } from "next";
import { isAuthed } from "@/lib/admin-auth";
import { getAdminLines } from "@/lib/admin-queries";
import { getCivilizations } from "@/lib/queries";
import { AdminShell, SignInPage } from "../admin-shell";
import { LinesTable } from "./lines-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Units",
  robots: { index: false, follow: false },
};

export default async function AdminUnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Auth first, then fetch. Never in parallel.
  if (!(await isAuthed())) return <SignInPage />;

  const [lines, civs] = await Promise.all([getAdminLines(locale), getCivilizations()]);

  return (
    <AdminShell>
      <LinesTable lines={lines} civs={civs} />
    </AdminShell>
  );
}
