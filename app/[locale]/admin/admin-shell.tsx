import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { AdminTabs } from "./admin-tabs";
import { SignIn } from "./admin-client";

/**
 * Frame for the two tab pages. Deliberately not a layout.tsx: that would also wrap
 * /admin/unit/[id], which is a detail page and has no business showing the tab strip.
 */
export function AdminShell({
  children,
  tabs = true,
}: {
  children: React.ReactNode;
  tabs?: boolean;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <AdminTitle />
        {tabs && <AdminTabs />}
        {children}
      </main>
    </>
  );
}

async function AdminTitle() {
  const t = await getTranslations();
  return <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("admin.heading")}</h1>;
}

/** No tab strip and, more to the point, no data fetch until there is a session. */
export function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <SignIn />
      </main>
    </>
  );
}
