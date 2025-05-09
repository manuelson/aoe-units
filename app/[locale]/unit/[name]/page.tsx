import { Metadata } from "next";
import { getUnitName } from "@/lib/units/get-unit-name";
import UnitPage from "./unit-page";
import { getUnitNameLine } from "@/lib/units/get-units-from-line";
import { Suspense } from "react";
import Loading from "./loading";

interface PageProps {
  params: Promise<{
    name: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, locale } = await params;
  const unitName = getUnitName(name, locale);

  return {
    title: `AoeUnits | ${getUnitNameLine(unitName, locale)} counter units`,
    description: `${getUnitNameLine(unitName, locale)} counter units`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={<Loading />}>
      <UnitPage params={resolvedParams} />
    </Suspense>
  );
}
