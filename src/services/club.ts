import type { ShotRequest, ShotResult } from "../types";
import { clubs, type Club } from "./club-ranges";
import type { TrajectoryService } from "./database.service";
import { getRoughSpeedPenalty } from "./penalty";
import type { ShotSuggestion } from "./suggest-shot.service";
import {
  calculateNeededEnvironmentModifiedCarry,
  calculateTrajectory,
} from "./trajectory";

export function guessClub(
  targetCarry: number,
  material: string,
  elevation: number,
  altitude: number
) {
  const getSpeedModifier = (speed: number, vla: number) => {
    return getRoughSpeedPenalty(material, speed, vla);
  };

  const environmentModifiedCarryForFindingClub =
    calculateNeededEnvironmentModifiedCarry(targetCarry, elevation, altitude);

  // Helper to calculate modified carry range for a club
  const getModifiedCarryRange = (club: Club) => {
    const avgVLA = (club.vlaMax + club.vlaMin) / 2;
    const minSpeedMod = getSpeedModifier(club.speedMin, avgVLA);
    const maxSpeedMod = getSpeedModifier(club.speedMax, avgVLA);
    return {
      minCarry: club.carryMin * minSpeedMod,
      maxCarry: club.carryMax * maxSpeedMod,
      avgVLA,
    };
  };

  // Find the closest club based on carry ranges
  let bestClubIndex = 0;
  let bestDistance = Infinity;

  clubs.forEach((club, index) => {
    const { minCarry, maxCarry } = getModifiedCarryRange(club);
    const rangeCenter = (minCarry + maxCarry) / 2;
    const distance = Math.abs(
      environmentModifiedCarryForFindingClub - rangeCenter
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestClubIndex = index;
    }
  });

  return {
    clubIndex: bestClubIndex,
    club: clubs[bestClubIndex],
  };
}

/**
 * Attempts to find the best shot parameters for a given club
 */
export async function tryClub(
  club: Club,
  targetCarry: number,
  material: string,
  upDownLie: number,
  rightLeftLie: number,
  elevation: number,
  altitude: number,
  trajectoryService: TrajectoryService
): Promise<ShotSuggestion> {
  const avgSpin = (club.spinMax + club.spinMin) / 2;
  const avgVLA = (club.vlaMax + club.vlaMin) / 2;

  const carryRatioToNormal =
    targetCarry / ((club.carryMax + club.carryMin) / 2);

  // Extend speed range based on how far outside normal carry range we are
  const extendedSpeedMin = club.speedMin * Math.min(carryRatioToNormal, 1);
  const extendedSpeedMax = club.speedMax * Math.max(carryRatioToNormal, 1);
  const extendedSpeedRange = extendedSpeedMax - extendedSpeedMin;

  // Determine number of speed samples and their values
  const SPEED_RANGE_THRESHOLD = 5; // m/s
  const speeds =
    extendedSpeedRange <= SPEED_RANGE_THRESHOLD
      ? [
          extendedSpeedMin,
          (extendedSpeedMin + extendedSpeedMax) / 2,
          extendedSpeedMax,
        ]
      : [
          extendedSpeedMin,
          extendedSpeedMin + extendedSpeedRange * 0.33,
          extendedSpeedMin + extendedSpeedRange * 0.66,
          extendedSpeedMax,
        ];

  const PERFECT_MATCH_THRESHOLD = 2.5; // meters - stop searching if we find a match this close
  let bestModifiedResult: ShotResult | null = null;
  let bestDiff = Infinity;

  for (const speed of speeds) {
    const request: ShotRequest = {
      material,
      speed,
      spin: avgSpin,
      vla: avgVLA,
      upDownLie,
      rightLeftLie,
      elevation,
      altitude,
    };
    const result = await calculateTrajectory(request, trajectoryService);

    if (!result) continue;

    const currentDiff = Math.abs(targetCarry - result.envCarry);

    // Early exit if we found a very close match
    if (currentDiff <= PERFECT_MATCH_THRESHOLD) {
      bestModifiedResult = result;
      break;
    }

    // If this result is worse than our best by a significant margin, skip to next speed
    if (bestModifiedResult && currentDiff > bestDiff * 1.5) continue;

    if (currentDiff < bestDiff) {
      bestDiff = currentDiff;
      bestModifiedResult = result;
    }
  }

  if (!bestModifiedResult) {
    throw new Error(`No valid trajectories found for club ${club.name}`);
  }

  const rawCarryData = await trajectoryService.findClosestTrajectory(
    bestModifiedResult.speed,
    avgSpin,
    avgVLA
  );

  if (!rawCarryData?.Carry) {
    throw new Error(`Failed to get raw trajectory data for club ${club.name}`);
  }

  return {
    ballSpeed: bestModifiedResult.adjustedSpeed,
    rawBallSpeed: bestModifiedResult.speed,
    spin: bestModifiedResult.adjustedSpin,
    rawSpin: avgSpin,
    vla: bestModifiedResult.adjustedVLA,
    estimatedCarry: bestModifiedResult.envCarry,
    rawCarry: rawCarryData.Carry,
    clubName: club.name,
    offlineAimAdjustment: -bestModifiedResult.offlineDeviation,
  };
}
