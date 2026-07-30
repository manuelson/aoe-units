"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchHistory } from "@/context/search-history";
import { Portrait } from "@/components/portrait";

export function RecentlyViewed() {
  const t = useTranslations();
  const { history, clearHistory, ready } = useSearchHistory();

  // Nothing to show before storage is read, and nothing to show if it is empty.
  // A placeholder here would be noise on a page that already has a browse grid.
  if (!ready || history.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("searchHistory.title")}
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("searchHistory.clear")}
        </button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {history.map((u) => (
          <li key={u.id}>
            <Link
              href={`/unit/${u.id.toLowerCase()}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 text-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Portrait id={u.avatar} name={u.name} size="sm" className="h-7 w-7" />
              <span className="truncate">{u.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
