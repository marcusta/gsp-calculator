/***********************************
 * Types and Data Structures
 ***********************************/

/** Represents one material configuration in the materials table. */
interface Material {
  name: string;
  offset1: number;
  offset2: number;
}

/** A lookup table for materials keyed by materialIndex. */
const materialsTable: Record<number, Material> = {
  12: { name: "semirough", offset1: 32, offset2: 20 },
  2: { name: "fairway", offset1: 48, offset2: 47 },
  18: { name: "tee", offset1: 48, offset2: 47 },

  1: { name: "rough", offset1: 0, offset2: 0 },
  6: { name: "earth", offset1: 0, offset2: 0 },
  16: { name: "pinestraw", offset1: 0, offset2: 0 },
  17: { name: "leaves", offset1: 0, offset2: 0 },

  3: { name: "deeprough", offset1: 16, offset2: 10 },

  4: { name: "concrete", offset1: 48, offset2: 30 },
  13: { name: "stone", offset1: 48, offset2: 30 },

  11: { name: "sand", offset1: 64, offset2: 40 },
};

const useNewTables = false;

/** Lookup tables for various penalty modifiers. */
const OldVLAToSpeed: number[] = [
  0.95, 0.95, 0.98, 1.0, 1.0, 1.0, 0.98, 0.98, 0.95, 0.9, 0.91, 0.91, 0.91,
  0.92, 0.92, 0.93, 0.94, 0.94, 0.94, 0.94, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.95,
];

const NewVLAToSpeed: number[] = [
  0.93, 0.935, 0.94, 0.945, 0.95, 0.955, 0.96, 0.965, 0.97, 0.98, 0.9, 0.905,
  0.91, 0.915, 0.92, 0.925, 0.93, 0.935, 0.94, 0.945, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.95, 0.95, 0.95,
];

const VLAToSpeed = useNewTables ? NewVLAToSpeed : OldVLAToSpeed;

const OldSpeedToSpeed: number[] = [
  0.98, 0.98, 0.98, 0.97, 0.97, 0.96, 0.96, 0.95, 0.95, 0.94, 0.94, 0.94, 0.94,
  0.94, 0.94, 0.94, 0.97, 0.94, 0.91, 0.88, 0.87, 0.86, 0.86, 0.86, 0.86, 0.86,
  0.86, 0.86, 0.86, 0.84, 0.82, 0.8, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985,
  0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.98, 0.96, 0.9, 0.6,
  0.7, 0.72, 0.75, 0.78, 0.83, 0.88, 0.9, 0.92, 0.93, 0.93, 0.93, 0.93, 0.93,
  0.93, 0.93, 0.93,
];

const NewSpeedToSpeed: number[] = [
  0.98, 0.98, 0.98, 0.97, 0.97, 0.96, 0.96, 0.95, 0.95, 0.94, 0.94, 0.94, 0.94,
  0.94, 0.94, 0.94, 0.97, 0.94, 0.92, 0.9, 0.88, 0.86, 0.86, 0.86, 0.86, 0.86,
  0.86, 0.86, 0.86, 0.84, 0.82, 0.8, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985,
  0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 0.985, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.75, 0.78, 0.82, 0.84, 0.86, 0.88,
  0.9, 0.92, 0.93, 0.93, 0.93, 0.93, 0.93, 0.93, 0.93, 0.93,
];

const SpeedToSpeed = useNewTables ? NewSpeedToSpeed : OldSpeedToSpeed;

const OldVLAToSpin: number[] = [
  0.9, 0.95, 0.95, 0.95, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.65, 0.68, 0.74, 0.74,
  0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
];

const NewVLAToSpin: number[] = [
  0.9, 0.91, 0.915, 0.92, 0.925, 0.93, 0.935, 0.94, 0.945, 0.95, 0.65, 0.68,
  0.74, 0.74, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

const VLAToSpin = useNewTables ? NewVLAToSpin : OldVLAToSpin;

const OldSpeedToSpin: number[] = [
  0.6, 0.63, 0.67, 0.7, 0.73, 0.77, 0.8, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85,
  0.85, 0.85, 0.85, 0.6, 0.61, 0.65, 0.69, 0.7, 0.74, 0.76, 0.76, 0.76, 0.76,
  0.76, 0.76, 0.76, 0.76, 0.76, 0.76, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95,
  0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.5, 0.6, 0.7,
  0.8, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
];

const NewSpeedToSpin: number[] = [
  0.6, 0.63, 0.67, 0.7, 0.73, 0.77, 0.8, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85,
  0.85, 0.85, 0.85, 0.6, 0.61, 0.65, 0.69, 0.7, 0.74, 0.76, 0.76, 0.76, 0.76,
  0.76, 0.76, 0.76, 0.76, 0.76, 0.76, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95,
  0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95,
  0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.5,
  0.525, 0.55, 0.6, 0.75, 0.825, 0.9, 0.975, 1, 1, 1, 1, 1, 1, 1, 1,
];

const SpeedToSpin = useNewTables ? NewSpeedToSpin : OldSpeedToSpin;

const SpeedToVLA: number[] = [
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0,
];

const VLAToVLA: number[] = [
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.98, 0.98, 0.98, 0.98,
  0.98, 0.98, 0.98, 0.98, 0.98, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
];

/***********************************
 * Utility Functions
 ***********************************/

/**
 * Linearly interpolates between start and end using the given amount.
 */
function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

/***********************************
 * Rough Speed Penalty Functions
 ***********************************/

/**
 * Computes the overall rough speed penalty based on material, speed, and VLA.
 */
export function getRoughSpeedPenalty(
  materialIndex: number,
  speed: number,
  VLA: number
): number {
  // Special case for tee and fairway
  if (materialIndex === 18 || materialIndex === 2) {
    return 1.0;
  }

  const speedMultiplier = getRoughSpeedPenaltyForSpeed(materialIndex, speed);
  const vlaMultiplier = getRoughSpeedPenaltyForVLA(materialIndex, VLA);
  return speedMultiplier * vlaMultiplier;
}

/**
 * Computes the rough speed penalty portion from VLA.
 */
export function getRoughSpeedPenaltyForVLA(
  materialIndex: number,
  VLA: number
): number {
  const { offset2 } = materialsTable[materialIndex];
  // Constrain VLA to [0, 45].
  VLA = Math.min(Math.max(VLA, 0), 45);

  // Missing line from original snippet:
  // We'll calculate this as it's done in similar functions.
  const vlaIndex = Math.floor(VLA / 5);

  if (vlaIndex < 9) {
    return lerp(
      VLAToSpeed[vlaIndex + offset2],
      VLAToSpeed[vlaIndex + 1 + offset2],
      (VLA % 5) / 5
    );
  } else {
    return VLAToSpeed[9 + offset2];
  }
}

/**
 * Computes the rough speed penalty portion from speed.
 */
export function getRoughSpeedPenaltyForSpeed(
  materialIndex: number,
  speed: number
): number {
  console.log("getRoughSpeedPenaltyForSpeed", materialIndex, speed);
  const { offset1 } = materialsTable[materialIndex];
  // Constrain speed to [0, 150].
  speed = Math.min(Math.max(speed, 0), 150);

  const speedIndex = Math.floor(speed / 10);
  if (speedIndex < 15) {
    return lerp(
      SpeedToSpeed[speedIndex + offset1],
      SpeedToSpeed[speedIndex + 1 + offset1],
      (speed % 10) / 10
    );
  } else {
    return SpeedToSpeed[15 + offset1];
  }
}

/***********************************
 * Rough Spin Penalty Functions
 ***********************************/

/**
 * Computes the overall rough spin penalty based on material, speed, and VLA.
 */
export function getRoughSpinPenalty(
  materialIndex: number,
  speed: number,
  VLA: number
): number {
  // Special case for tee and fairway
  if (materialIndex === 18 || materialIndex === 2) {
    return 1.0;
  }

  const speedMultiplier = getRoughSpinPenaltyForSpeed(materialIndex, speed);
  const vlaMultiplier = getRoughSpinPenaltyForVLA(materialIndex, VLA);
  return speedMultiplier * vlaMultiplier;
}

/**
 * Computes the rough spin penalty portion from VLA.
 */
export function getRoughSpinPenaltyForVLA(
  materialIndex: number,
  VLA: number
): number {
  const { offset2 } = materialsTable[materialIndex];
  // Constrain VLA to [0, 45].
  VLA = Math.min(Math.max(VLA, 0), 45);

  const vlaIndex = Math.floor(VLA / 5);
  if (vlaIndex < 9) {
    return lerp(
      VLAToSpin[vlaIndex + offset2],
      VLAToSpin[vlaIndex + 1 + offset2],
      (VLA % 5) / 5
    );
  } else {
    return VLAToSpin[9 + offset2];
  }
}

/**
 * Computes the rough spin penalty portion from speed.
 */
export function getRoughSpinPenaltyForSpeed(
  materialIndex: number,
  speed: number
): number {
  const { offset1 } = materialsTable[materialIndex];
  // Constrain speed to [0, 150].
  speed = Math.min(Math.max(speed, 0), 150);

  const speedIndex = Math.floor(speed / 10);
  if (speedIndex < 15) {
    return lerp(
      SpeedToSpin[speedIndex + offset1],
      SpeedToSpin[speedIndex + 1 + offset1],
      (speed % 10) / 10
    );
  } else {
    return SpeedToSpin[15 + offset1];
  }
}

/***********************************
 * Rough VLA Penalty Functions
 ***********************************/

/**
 * Computes the overall rough VLA penalty based on material, speed, and VLA.
 */
export function getRoughVLAPenalty(
  materialIndex: number,
  speed: number,
  VLA: number
): number {
  // Special case for tee and fairway
  if (materialIndex === 18 || materialIndex === 2) {
    return 1.0;
  }

  const speedMultiplier = getRoughVLAPenaltyForSpeed(materialIndex, speed);
  const vlaMultiplier = getRoughVLAPenaltyForVLA(materialIndex, VLA);
  return speedMultiplier * vlaMultiplier;
}

/**
 * Computes the rough VLA penalty portion from VLA.
 */
export function getRoughVLAPenaltyForVLA(
  materialIndex: number,
  VLA: number
): number {
  const { offset2 } = materialsTable[materialIndex];
  // Constrain VLA to [0, 45].
  VLA = Math.min(Math.max(VLA, 0), 45);

  const vlaIndex = Math.floor(VLA / 5);
  if (vlaIndex < 9) {
    return lerp(
      VLAToVLA[vlaIndex + offset2],
      VLAToVLA[vlaIndex + 1 + offset2],
      (VLA % 5) / 5
    );
  } else {
    return VLAToVLA[9 + offset2];
  }
}

/**
 * Computes the rough VLA penalty portion from speed.
 */
export function getRoughVLAPenaltyForSpeed(
  materialIndex: number,
  speed: number
): number {
  const { offset1 } = materialsTable[materialIndex];
  // Constrain speed to [0, 150].
  speed = Math.min(Math.max(speed, 0), 150);

  const speedIndex = Math.floor(speed / 10);
  if (speedIndex < 15) {
    return lerp(
      SpeedToVLA[speedIndex + offset1],
      SpeedToVLA[speedIndex + 1 + offset1],
      (speed % 10) / 10
    );
  } else {
    return SpeedToVLA[15 + offset1];
  }
}

/**
 * Calculates the altitude modifier for shot distance.
 * Shots travel approximately 1% further per 500 feet of altitude.
 * @param altitude Altitude in feet above sea level
 */
export function getAltitudeModifier(
  altitude: number,
  targetDistance = 1
): number {
  // 1% increase per 500 feet
  const distanceScaling = getDistanceScalingFactorForAltitude(
    altitude,
    targetDistance
  );
  console.log("distanceScaling", distanceScaling);
  const rawAltitudeScaling = (altitude / 500) * 0.01;
  const result = distanceScaling + rawAltitudeScaling;
  console.log("rawAltitudeScaling", rawAltitudeScaling);
  console.log("result", result);
  return result;
}

function getDistanceScalingFactorForAltitude(
  altitude: number,
  targetDistance: number
): number {
  // Scaling should be larger with higher altitude and essentially no effect at 0 altitude
  return 1 + ((targetDistance + altitude / 300) / 100) * 0.01;
}

interface LaunchType {
  name: string;
  vlaRange: [number, number];
  spinRange: [number, number];
  // Multipliers for different elevation ranges
  // Higher numbers mean more distance effect
  elevationMultipliers: {
    downhillSteep: number; // > 25m downhill
    downhillMedium: number; // 15-25m downhill
    downhillMild: number; // 5-15m downhill
    flat: number; // ±5m
    uphillMild: number; // 5-15m uphill
    uphillMedium: number; // 15-25m uphill
    uphillSteep: number; // > 25m uphill
  };
}

const launchTypes: LaunchType[] = [
  {
    name: "Low Spin Driver",
    vlaRange: [0, 20],
    spinRange: [0, 2000],
    elevationMultipliers: {
      downhillSteep: 1.5, // Most sensitive to downhill
      downhillMedium: 1.3,
      downhillMild: 1.2,
      flat: 1.0,
      uphillMild: 1.2,
      uphillMedium: 1.5,
      uphillSteep: 1.8, // Most affected by uphill
    },
  },
  {
    name: "Medium Spin Driver",
    vlaRange: [0, 20],
    spinRange: [2000, 2600],
    elevationMultipliers: {
      downhillSteep: 1.45,
      downhillMedium: 1.35,
      downhillMild: 1.15,
      flat: 1.0,
      uphillMild: 1.15,
      uphillMedium: 1.45,
      uphillSteep: 1.65,
    },
  },
  {
    name: "High Spin Woods/Hybrids",
    vlaRange: [0, 22],
    spinRange: [2600, 3500],
    elevationMultipliers: {
      downhillSteep: 1.4,
      downhillMedium: 1.3,
      downhillMild: 1.15,
      flat: 1.0,
      uphillMild: 1.2,
      uphillMedium: 1.4,
      uphillSteep: 1.6,
    },
  },
  {
    name: "Low/Mid Irons",
    vlaRange: [8, 22],
    spinRange: [3500, 5000],
    elevationMultipliers: {
      downhillSteep: 1.4,
      downhillMedium: 1.15,
      downhillMild: 1.05,
      flat: 1.0,
      uphillMild: 1.05,
      uphillMedium: 1.15,
      uphillSteep: 1.25,
    },
  },
  {
    name: "Mid Irons",
    vlaRange: [14, 23],
    spinRange: [4500, 5800],
    elevationMultipliers: {
      downhillSteep: 1.4,
      downhillMedium: 1.1,
      downhillMild: 1.05,
      flat: 1.0,
      uphillMild: 1.05,
      uphillMedium: 1.15,
      uphillSteep: 1.3,
    },
  },
  {
    name: "Mid/High Irons",
    vlaRange: [14, 23],
    spinRange: [5800, 7500],
    elevationMultipliers: {
      downhillSteep: 1.08,
      downhillMedium: 1.05,
      downhillMild: 1.01,
      flat: 1.0,
      uphillMild: 1.01,
      uphillMedium: 1.07,
      uphillSteep: 1.1,
    },
  },
  {
    name: "High Irons",
    vlaRange: [16, 30],
    spinRange: [6000, 9000],
    elevationMultipliers: {
      downhillSteep: 0.95,
      downhillMedium: 0.98,
      downhillMild: 0.99,
      flat: 1.0,
      uphillMild: 1.0,
      uphillMedium: 1.1,
      uphillSteep: 1.2,
    },
  },
  {
    name: "Wedges",
    vlaRange: [21, 70],
    spinRange: [9000, 10000],
    elevationMultipliers: {
      downhillSteep: 0.9, // Less affected by downhill
      downhillMedium: 0.95,
      downhillMild: 0.98,
      flat: 1.0,
      uphillMild: 0.98,
      uphillMedium: 0.95,
      uphillSteep: 0.9, // Less affected by uphill
    },
  },
  {
    name: "High Loft Wedges",
    vlaRange: [22, 70],
    spinRange: [10000, 99999],
    elevationMultipliers: {
      downhillSteep: 0.8, // Least affected by elevation
      downhillMedium: 0.9,
      downhillMild: 0.95,
      flat: 1.0,
      uphillMild: 0.95,
      uphillMedium: 0.9,
      uphillSteep: 0.8,
    },
  },
];

// Add a new helper function to calculate a distance-based scaling factor
function getDistanceScalingFactorForElevation(targetDistance: number): number {
  // Scale the effect based on distance, with full effect at 200m and reduced effect for shorter shots
  // Minimum scaling of 0.7 for very short shots, scaling up to 1.0 for long shots
  return 0.7 + Math.min(targetDistance / 200, 1) * 0.3;
}

export function getElevationDistanceModifier(
  targetDistance: number,
  elevationDiff: number,
  ballSpeed: number,
  spin: number,
  vla: number
): number {
  // Find the appropriate launch type based on VLA and spin
  const launchType =
    launchTypes.find(
      (lt) =>
        vla >= lt.vlaRange[0] &&
        vla <= lt.vlaRange[1] &&
        spin >= lt.spinRange[0] &&
        spin <= lt.spinRange[1]
    ) || launchTypes[4];

  // Determine which elevation range we're in
  let multiplier: number;
  if (elevationDiff <= -25) {
    multiplier = launchType.elevationMultipliers.downhillSteep;
  } else if (elevationDiff <= -15) {
    multiplier = launchType.elevationMultipliers.downhillMedium;
  } else if (elevationDiff <= -5) {
    multiplier = launchType.elevationMultipliers.downhillMild;
  } else if (elevationDiff <= 5) {
    multiplier = launchType.elevationMultipliers.flat;
  } else if (elevationDiff <= 15) {
    multiplier = launchType.elevationMultipliers.uphillMild;
  } else if (elevationDiff <= 25) {
    multiplier = launchType.elevationMultipliers.uphillMedium;
  } else {
    multiplier = launchType.elevationMultipliers.uphillSteep;
  }

  console.log("ball speed", ballSpeed);

  // Scale the effect based on target distance
  const distanceScaling = getDistanceScalingFactorForElevation(targetDistance);

  // Apply both multipliers to the elevation difference
  return -elevationDiff * multiplier * distanceScaling;
}
