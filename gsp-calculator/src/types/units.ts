export type DistanceUnit = "meters" | "yards";

export const convertMetersToYards = (meters: number): number =>
  meters * 1.09361;
