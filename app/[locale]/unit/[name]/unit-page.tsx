import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { useAoeDataById } from "@/data/useAoeData";
import { Footer } from "@/components/footer";
import { UnitHeader } from "./components/unit-header";
import { UnitInfo } from "./components/unit-info";
import { CounterUnits } from "./components/counter-units";

type UnitPageClientProps = {
  params: { name: string; locale: string };
};

export default function UnitPage({ params }: UnitPageClientProps) {
  const { name } = params;
  const t = useTranslations();
  const unit = useAoeDataById(name.toLowerCase().trim(), params.locale);

  if (!unit) {
    notFound();
  }

  return (
    <section className="flex flex-col justify-between items-center pt-5">
      <UnitHeader />
      <div className="w-full max-w-4xl space-y-8 px-4">
        <div>
          <SearchBar placeholder={t("searchPlaceholder")} />
        </div>
        <UnitInfo unit={unit} />
        <CounterUnits counterLines={unit.counterLines} />
      </div>
      <Footer />
    </section>
  );
}
