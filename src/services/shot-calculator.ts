import type { TrajectoryService } from "./database.service";
import {
  getAltitudeModifier,
  getElevationDistanceModifier,
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./penalty";

export class ShotCalculator {
  constructor(private trajectoryService: TrajectoryService) {}

  async calculateCarry(
    ballSpeed: number,
    spin: number,
    vla: number,
    material: string,
    upDownLie = 0,
    rightLeftLie = 0,
    elevation = 0,
    altitude = 0
  ) {
    console.log("ballSpeed", ballSpeed);
    const modifiedSpeed =
      ballSpeed * getRoughSpeedPenalty(material, ballSpeed, vla);
    const modifiedSpin = spin * getRoughSpinPenalty(material, ballSpeed, vla);
    const materialModifiedVLA =
      vla * getRoughVLAPenalty(material, ballSpeed, vla);
    const materialAndlieModifiedVLA = getModifiedLieVla(
      materialModifiedVLA,
      upDownLie
    );

    console.log("materialAndlieModifiedVLA", materialAndlieModifiedVLA);
    console.log("modifiedSpeed", modifiedSpeed);
    console.log("modifiedSpin", modifiedSpin);

    const modifiedTrajectory =
      await this.trajectoryService.findClosestTrajectory(
        modifiedSpeed,
        modifiedSpin,
        materialAndlieModifiedVLA
      );
    console.log("modifiedTrajectory", modifiedTrajectory);

    const rawTrajectory = await this.trajectoryService.findClosestTrajectory(
      ballSpeed,
      spin,
      vla
    );
    console.log("rawTrajectory", rawTrajectory);

    let offlineDeviation = 0;
    if (rightLeftLie > 0) {
      offlineDeviation = calculateOfflineDeviation(
        materialAndlieModifiedVLA,
        rightLeftLie,
        modifiedTrajectory?.Carry ?? 0
      );
      console.log("offlineDeviation", offlineDeviation);
    }

    let elevationEffect = 0;
    if (elevation !== 0) {
      elevationEffect = getElevationDistanceModifier(
        modifiedTrajectory?.Carry ?? 0,
        elevation,
        ballSpeed,
        spin,
        materialAndlieModifiedVLA
      );
      console.log("elevationEffect", elevationEffect);
    } else {
      console.log("elevationEffect", 1);
      elevationEffect = 1;
    }

    let altitudeEffect = 0;
    if (altitude > 0) {
      altitudeEffect = getAltitudeModifier(altitude);
      console.log("altitudeEffect", altitudeEffect);
    } else {
      altitudeEffect = 1;
    }

    const finalCarry =
      (modifiedTrajectory?.Carry ?? 0) * altitudeEffect + elevationEffect || 0;

    return {
      carryRaw: rawTrajectory?.Carry ?? 0,
      carryModified: finalCarry,
      offlineDeviation: offlineDeviation,
      rawSpin: spin,
      rawVLA: vla,
      rawSpeed: ballSpeed,
      vlaModified: materialAndlieModifiedVLA,
      spinModified: modifiedSpin,
      speedModified: modifiedSpeed,
      material: material,
    };
  }
}

const lieVlaToVla = [1, 1, 0.7, 0.6, 0.55, 0.5, 0.45, 0.4, 0.3, 0.2];
const lieVLAtoHLA = [0.5, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.1, 0.1, 0.05];

export function calculateVLAModification(vla: number) {
  const lieIndex = Math.floor(vla / 5);
  return lieVlaToVla[lieIndex];
}

export function calculateHLAModification(vla: number) {
  const lieIndex = Math.floor(vla / 5);
  return lieVLAtoHLA[lieIndex];
}

export function getModifiedLieVla(vla: number, lieDegrees: number) {
  const vlaModification = calculateVLAModification(vla);
  return vla + vlaModification * lieDegrees;
}

export function getModifiedLieHla(vla: number, lieDegrees: number) {
  const hlaModification = calculateHLAModification(vla);
  return hlaModification * lieDegrees;
}

export function calculateOfflineDeviation(
  vla: number,
  lieDegrees: number,
  distanceMeters: number
) {
  // Get the HLA modification based on VLA
  const hlaModification = calculateHLAModification(vla);

  // Calculate the effective horizontal angle
  const effectiveAngle = hlaModification * lieDegrees;

  // Use basic trigonometry to calculate the offline deviation
  // tan(angle) = opposite / adjacent
  // Therefore: offline = distance * tan(angle)
  const angleInRadians = (effectiveAngle * Math.PI) / 180;
  const offlineDeviation = distanceMeters * Math.tan(angleInRadians);

  // Round to 1 decimal place
  return Math.round(offlineDeviation * 10) / 10;
}
