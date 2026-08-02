import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CommandSearch } from "@/components/command-search";
import { Portrait } from "@/components/portrait";
import type { LineSummary } from "@/lib/queries";

/** Recognisable units, one per class, for the right-hand composition. */
const SHOWCASE = [
  "Knight",
  "Longbowman",
  "TeutonicKnight",
  "Mangudai",
  "Mangonel",
  "Samurai",
  "CamelRider",
  "JaguarWarrior",
  "Cataphract",
];

/*
 * Entry motion here is CSS, not Motion. `animate-in` animates *from* the offset state to
 * the element's natural one, so the hero is visible even if the animation never runs.
 * Motion's `initial={{opacity: 0}}` leaves the LCP headline invisible whenever its rAF
 * loop is throttled (background tab, slow hydration), which is exactly what happened here.
 */
const ENTER = "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both";

export async function Hero({
  lines,
  counterCount,
}: {
  lines: LineSummary[];
  counterCount: number;
}) {
  const t = await getTranslations();
  const byId = new Map(lines.map((l) => [l.id, l]));

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div>
        <h1
          className={`${ENTER} text-4xl font-semibold tracking-tight text-balance sm:text-5xl`}
        >
          {t("hero.headline")}
        </h1>

        <p className={`${ENTER} delay-75 mt-5 max-w-[46ch] text-lg text-muted-foreground`}>
          {t("hero.sub")}
        </p>

        <div className={`${ENTER} delay-150 mt-7 max-w-lg`}>
          <CommandSearch lines={lines} />
        </div>

        <div className={`${ENTER} delay-200 mt-5 flex flex-wrap items-center gap-5`}>
          <Link
            href="/units"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("hero.browse")}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">
            {t("hero.stat", { lines: lines.length, counters: counterCount })}
          </p>
        </div>
      </div>

      {/* Not decorative any more: each tile links to that unit's counters. */}
      <ul className="grid grid-cols-3 gap-3 sm:gap-4">
        {SHOWCASE.map((id, i) => {
          const line = byId.get(id);
          if (!line) return null;
          return (
            <li
              key={id}
              className={ENTER}
              style={{ animationDelay: `${150 + i * 40}ms` }}
            >
              <Link
                href={`/unit/${id.toLowerCase()}`}
                title={t("hero.showcaseLink", { unit: line.name })}
                className="group relative block overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Portrait
                  id={id}
                  name={line.name}
                  size="xl"
                  priority={i < 3}
                  alt={t("hero.showcaseLink", { unit: line.name })}
                  className="h-full w-full"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {line.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
