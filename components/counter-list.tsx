import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import type { CounterEntry } from "@/lib/queries";

/**
 * A list of counter lines. Every entry is a link: the old unit page rendered these as
 * <span>s, so there was no way to click through to the unit that beats yours.
 */
export function CounterList({ lines }: { lines: CounterEntry[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {lines.map((line) => (
        <li key={line.id}>
          <Link
            href={`/unit/${line.id.toLowerCase()}`}
            className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Portrait id={line.id} name={line.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium leading-tight">{line.name}</span>
              {line.units.length > 1 && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {line.units.map((u) => u.name).join(" · ")}
                </span>
              )}
              {line.civ && (
                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CivBadge civ={line.civ} size={14} />
                  <span className="truncate">{line.civ}</span>
                </span>
              )}
              {line.reason && (
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {line.reason}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
