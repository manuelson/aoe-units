import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import { CLASS_ORDER, type CounterEntry } from "@/lib/queries";

/**
 * A list of counter lines, in the same tile language as the browse grid: the portrait is
 * the tile, the label sits on the page background. The old two-column cards gave the art
 * 56px and spent the rest of the row on the upgrade chain, which is already on the page
 * you land on when you click through.
 *
 * Ordered by class, then by name. One flat grid, no headings: infantry still lands before
 * cavalry before siege, but the eye is not made to cross a section break for it. Sorting
 * on the translated name alone put the same list in a different order per locale.
 */
export function CounterList({ lines }: { lines: CounterEntry[] }) {
  const byClass = [...lines].sort(
    (a, b) => CLASS_ORDER.indexOf(a.unitClass) - CLASS_ORDER.indexOf(b.unitClass)
  );

  return (
    // Caps at 5 columns, not the 7 of the browse grid: the matchup notes need the width.
    <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
      {byClass.map((line) => (
        <li key={line.id}>
          <Link
            href={`/unit/${line.id.toLowerCase()}`}
            className="group block focus-visible:outline-none"
          >
            <Portrait
              id={line.id}
              name={line.name}
              size="tile"
              className="transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-ring"
            />
            <span className="mt-2 block line-clamp-2 text-[13px] font-medium leading-tight group-hover:text-primary">
              {line.name}
            </span>
            {line.civ && (
              <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CivBadge civ={line.civ} size={12} />
                <span className="truncate">{line.civ}</span>
              </span>
            )}
            {line.reason && (
              <span className="mt-1.5 block text-[11px] leading-snug text-muted-foreground">
                {line.reason}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
