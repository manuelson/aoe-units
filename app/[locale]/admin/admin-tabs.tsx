"use client";

import { useRouter } from "next/navigation";
import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Routes, not local state: both tabs stay server-rendered, the queue keeps its
 * force-dynamic without dragging the 111-row table along, and /admin/units is linkable.
 */
export function AdminTabs() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const tab = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "-mb-px border-b-2 px-1 pb-2.5 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "border-primary font-medium text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
      </Link>
    );
  };

  async function logout() {
    await fetch("/api/admin", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mb-8 flex items-end gap-6 border-b border-border">
      {tab("/admin", t("admin.tabReview"))}
      {tab("/admin/units", t("admin.tabUnits"))}
      <button
        type="button"
        onClick={logout}
        className="ml-auto mb-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
        {t("admin.logout")}
      </button>
    </div>
  );
}
