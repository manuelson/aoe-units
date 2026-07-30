import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";

/**
 * The rock-paper-scissors core of AoE2 combat, using the real unit art. Three nodes in
 * a cycle, so it reads as a loop rather than a list.
 */
const CYCLE = [
  { id: "Spearman", beats: "Knight" },
  { id: "Knight", beats: "Archer" },
  { id: "Archer", beats: "Spearman" },
] as const;

export async function CounterTriangle({ names }: { names: Record<string, string> }) {
  const t = await getTranslations();

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("triangle.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("triangle.body")}</p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {CYCLE.map((node, i) => (
            <li
              key={node.id}
              // CSS enter rather than a Motion scroll reveal: these cards stay visible
              // even if no animation runs. See the note in hero.tsx.
              className="flex animate-in items-center gap-3 rounded-xl border border-border bg-card p-4 fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Link
                href={`/unit/${node.id.toLowerCase()}`}
                className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Portrait id={node.id} name={names[node.id] ?? node.id} size="md" />
                <span className="truncate font-medium">{names[node.id] ?? node.id}</span>
              </Link>

              <ArrowRight
                className="mx-1 h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.75}
                aria-label={t("triangle.beats")}
              />

              <Link
                href={`/unit/${node.beats.toLowerCase()}`}
                className="flex min-w-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Portrait id={node.beats} name={names[node.beats] ?? node.beats} size="sm" />
                <span className="truncate text-sm text-muted-foreground">
                  {names[node.beats] ?? node.beats}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
