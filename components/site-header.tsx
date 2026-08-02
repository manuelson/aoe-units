import { Link } from "@/i18n/navigation";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { CommandSearch } from "./command-search";
import type { LineSummary } from "@/lib/queries";

/**
 * Single-line nav, 64px tall. `lines` present means the compact search sits in the bar.
 * `searchLabel` names what the page is showing, so on a unit page the bar reads the unit
 * you are on instead of a prompt you have already answered.
 */
export function SiteHeader({
  lines,
  searchLabel,
}: {
  lines?: LineSummary[];
  searchLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      {/* gap-1 on phones so the collapsed search icon sits in the same run as the toggles. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:gap-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          AoeUnits
        </Link>

        {lines && (
          <div className="ml-auto shrink-0 sm:min-w-0 sm:flex-1 sm:shrink">
            <CommandSearch lines={lines} variant="compact" label={searchLabel} />
          </div>
        )}

        {/* Only one auto margin in the row. A second one splits the free space between the
            two, which on phones leaves the collapsed search icon floating off the toggles. */}
        <div className={`flex shrink-0 items-center gap-1 ${lines ? "" : "ml-auto"}`}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
