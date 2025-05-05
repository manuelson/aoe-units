import { Metadata } from "next";
import { getUnitName } from "@/lib/units/get-unit-name";
import UnitPageClient from "./unit-page-client";
import { getUnitNameLine } from "@/lib/units/get-units-from-line";

type Props = {
  params: { name: string; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, locale } = await Promise.resolve(params);
  const unitName = getUnitName(name, locale);

  return {
    title: `AoeUnits | ${getUnitNameLine(unitName, locale)}`,
    description: `${getUnitNameLine(unitName, locale)} counter units`,
  };
}

export default function PageUnit() {
  return <UnitPageClient />;
}
