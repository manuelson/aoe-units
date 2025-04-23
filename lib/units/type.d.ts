export type Unit = string[];

export type UnitLine = {
  units: Unit;
  unique: boolean;
  counteredBy: Unit;
  upgrades: string[];
};
