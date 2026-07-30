import { Link } from "@/i18n/navigation";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { CommandSearch } from "./command-search";
import type { LineSummary } from "@/lib/queries";

/** Single-line nav, 64px tall. `lines` present means the compact search sits in the bar. */
export function SiteHeader({ lines }: { lines?: LineSummary[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          AoeUnits
        </Link>

        {lines && (
          <div className="ml-auto hidden w-full max-w-xs sm:block">
            <CommandSearch lines={lines} variant="compact" />
          </div>
        )}

        <div className={`flex shrink-0 items-center gap-1 ${lines ? "" : "ml-auto"}`}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
