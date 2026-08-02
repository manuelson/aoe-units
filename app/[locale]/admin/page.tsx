import type { Metadata } from "next";
import { isAuthed } from "@/lib/admin-auth";
import { AdminShell, SignInPage } from "./admin-shell";
import { QueueData } from "./queue-data";

// Always fresh: a moderation queue that is an hour stale is useless.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAuthed())) return <SignInPage />;

  return (
    <AdminShell>
      <QueueData locale={locale} />
    </AdminShell>
  );
}
