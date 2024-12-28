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
  12: { name: "TVGsemirough", offset1: 32, offset2: 20 },

  1: { name: "TVGrough", offset1: 0, offset2: 0 },
  6: { name: "TVGearth", offset1: 0, offset2: 0 },
  16: { name: "TVGpinestraw", offset1: 0, offset2: 0 },
  17: { name: "TVGleaves", offset1: 0, offset2: 0 },

  3: { name: "TVGdeeprough", offset1: 16, offset2: 10 },

  4: { name: "TVGconcrete", offset1: 48, offset2: 30 },
  13: { name: "TVGstone", offset1: 48, offset2: 30 },

  11: { name: "TVGsand", offset1: 64, offset2: 40 },
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
