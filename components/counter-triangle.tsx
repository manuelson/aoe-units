import { getTranslations } from "next-intl/server";
import { ArrowRight, ChevronUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";

/**
 * The rock-paper-scissors core of AoE2 combat, using the real unit art. Drawn as a closed
 * loop: the previous version was three identical cards in a row, which reads as a list and
 * hides the one thing that matters here, that the third unit loops back to the first.
 */
const CYCLE = ["Spearman", "Knight", "Archer"] as const;

export async function CounterTriangle({
  names,
}: {
  names: Record<string, string>;
}) {
  const t = await getTranslations();

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("triangle.title")}
          </h2>
          <p className="mt-3 max-w-prose text-muted-foreground">
            {t("triangle.body")}
          </p>
        </div>

        {/*
          Three equal columns, so the arrows can sit at the exact column boundaries (1/3, 2/3)
          and the return arc can span centre to centre (1/6 to 5/6) without measuring anything.
        */}
        <div className="relative pb-16">
          {/* No column gap on purpose: a gap shrinks the columns and pulls each portrait
              a few px inward, so it no longer lines up with the arrows and the arc, which
              sit at exact thirds. Separation comes from the padding on each item. */}
          <ol className="grid grid-cols-3">
            {CYCLE.map((id, i) => (
              <li
                key={id}
                // CSS enter rather than a Motion scroll reveal: these stay visible even if
                // no animation runs. See the note in hero.tsx.
                className="animate-in px-1 text-center fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Link
                  href={`/unit/${id.toLowerCase()}`}
                  className="group block focus-visible:outline-none"
                >
                  <Portrait
                    id={id}
                    name={names[id] ?? id}
                    size="xl"
                    className="mx-auto h-20 w-20 transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-ring sm:h-28 sm:w-28"
                  />
                  <span className="mt-2 block truncate text-sm font-medium group-hover:text-primary">
                    {names[id] ?? id}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {/* The loop itself. Decorative: the paragraph above already states it in words. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <ArrowRight
              className="absolute left-1/3 top-8 h-4 w-4 -translate-x-1/2 text-primary sm:top-12 sm:h-5 sm:w-5"
              strokeWidth={2}
            />
            <ArrowRight
              className="absolute left-2/3 top-8 h-4 w-4 -translate-x-1/2 text-primary sm:top-12 sm:h-5 sm:w-5"
              strokeWidth={2}
            />
            {/* The arc draws the line and the chevron only caps it. An ArrowUp lays a
                second stem over the border, which reads as a thicker, offset stroke. */}
            <span className="absolute inset-x-[16.667%] bottom-0 h-9 rounded-b-2xl border-b border-l border-r border-primary" />
            <ChevronUp
              className="absolute bottom-7 left-[16.667%] h-4 w-4 -translate-x-1/2 text-primary sm:bottom-6 sm:h-5 sm:w-5"
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
