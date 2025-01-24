// services/suggestShot.service.ts
import { clubs, type Club } from "./club-ranges";
import { TrajectoryService } from "./database.service";
import {
  getAltitudeModifier,
  getElevationDistanceModifier,
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./penalty";
import { getModifiedLieVla } from "./shot-calculator";

export class SuggestShotService {
  private trajectoryService: TrajectoryService;

  constructor(trajectoryService: TrajectoryService) {
    this.trajectoryService = trajectoryService;
  }

  /**
   * Main function that the route will call.
   *
   * @param targetCarry   desired carry distance (meters or yards)
   * @param material      material name
   * @param upDownLie     up/down lie angle (degrees)
   * @param rightLeftLie  right/left lie angle (degrees)
   * @param elevation     elevation (meters)
   * @param altitude      altitude (meters)
   * @returns A single "best" shot object including club data and ball data
   */
  public async getSuggestion(
    targetCarry: number,
    material: string,
    upDownLie: number,
    rightLeftLie: number,
    elevation: number,
    altitude: number
  ): Promise<ShotSuggestion | undefined> {
    return suggestShot(
      targetCarry,
      material,
      upDownLie,
      rightLeftLie,
      elevation,
      altitude,
      this.trajectoryService
    );
  }

  private lerp(start: number, end: number, ratio: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, ratio));
  }
}

export interface ShotSuggestion {
  ballSpeed: number; // The penalized/modified speed
  rawBallSpeed: number; // The original unmodified speed
  spin: number; // The penalized/modified spin
  rawSpin: number; // The original unmodified spin
  vla: number;
  rawCarry: number; // direct from DB
  estimatedCarry: number;
  clubName: string;
}

/**
 * Main function that the route will call.
 *
 * @param targetCarry   desired carry distance (meters)
 * @param material      material name
 * @param upDownLie     up/down lie angle (degrees), positive is uphill and negative is downhill, 0 is none
 * @param rightLeftLie  right/left lie angle (degrees), positive is right and negative is left, 0 is none
 * @param elevation     elevation (meters), negative is downhill and positive is uphill
 * @param altitude      altitude (feet), only positive values are supported. Ball flies longer with higher altitude.
 * @returns A single "best" shot object including club data and ball data
 */
export async function suggestShot(
  targetCarry: number,
  material: string,
  upDownLie: number,
  rightLeftLie: number,
  elevation: number,
  altitude: number,
  trajectoryService: TrajectoryService
): Promise<ShotSuggestion | undefined> {
  // Get speed modifier based on material and lie
  const getSpeedModifier = (speed: number, vla: number) => {
    return getRoughSpeedPenalty(material, speed, vla);
  };

  const altitudeEffect = getAltitudeModifier(altitude);
  const elevationEffect = getElevationDistanceModifier(
    targetCarry,
    elevation,
    120,
    5800,
    18
  );
  const environmentModifiedCarry =
    targetCarry * altitudeEffect + elevationEffect;

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

  // First find the best club based on carry ranges
  let bestClubIndex = -1;
  let bestScore = Infinity;

  clubs.forEach((club, index) => {
    const { minCarry, maxCarry } = getModifiedCarryRange(club);
    // Allow some flexibility in the ranges
    const minAllowed = minCarry * 0.9;
    const maxAllowed = maxCarry * 1.1;

    if (
      environmentModifiedCarry >= minAllowed &&
      environmentModifiedCarry <= maxAllowed
    ) {
      const rangeCenter = (minCarry + maxCarry) / 2;
      const score = Math.abs(environmentModifiedCarry - rangeCenter);

      if (score < bestScore) {
        bestScore = score;
        bestClubIndex = index;
      }
    }
  });

  if (bestClubIndex === -1) {
    throw new Error("No suitable club found for the target carry distance");
  }

  // Function to try a specific club with carry data
  async function tryClub(clubIndex: number): Promise<ShotSuggestion> {
    const club = clubs[clubIndex];
    const speedRange = club.speedMax - club.speedMin;
    const avgSpin = (club.spinMax + club.spinMin) / 2;
    const avgVLA = (club.vlaMax + club.vlaMin) / 2;

    // Try 5 different speeds
    const speeds = [
      club.speedMin,
      club.speedMin + speedRange * 0.25,
      club.speedMin + speedRange * 0.5,
      club.speedMin + speedRange * 0.75,
      club.speedMax,
    ];

    const CARRY_THRESHOLD = 10; // meters - only get raw data if within this threshold

    const results = await Promise.all(
      speeds.map(async (speed) => {
        const speedPenalty = getRoughSpeedPenalty(material, speed, avgVLA);
        const spinPenalty = getRoughSpinPenalty(material, speed, avgVLA);
        const vlaPenalty = getRoughVLAPenalty(material, speed, avgVLA);

        const adjustedSpeed = speed * speedPenalty;
        const adjustedSpin = avgSpin * spinPenalty;
        const adjustedVLA = avgVLA * vlaPenalty;
        const modifiedVLA = getModifiedLieVla(adjustedVLA, upDownLie);

        // First get only the modified carry distance
        const modifiedCarryData = await trajectoryService.findClosestTrajectory(
          adjustedSpeed,
          adjustedSpin,
          modifiedVLA
        );

        // Early return if we don't have valid modified carry data
        if (!modifiedCarryData?.Carry) {
          return null;
        }

        // Only get raw carry if the modified carry is close enough to target
        let rawCarryData = null;
        if (
          Math.abs(modifiedCarryData.Carry - targetCarry) <= CARRY_THRESHOLD
        ) {
          rawCarryData = await trajectoryService.findClosestTrajectory(
            speed,
            avgSpin,
            avgVLA
          );

          // Skip if raw carry data is invalid
          if (!rawCarryData?.Carry) {
            return null;
          }
        } else {
          // If not close enough, use modified carry as raw carry
          // This is an approximation but acceptable for shots we won't use
          rawCarryData = modifiedCarryData;
        }

        return {
          ballSpeed: adjustedSpeed,
          rawBallSpeed: speed,
          spin: adjustedSpin,
          rawSpin: avgSpin,
          vla: modifiedVLA,
          estimatedCarry: modifiedCarryData.Carry,
          rawCarry: rawCarryData.Carry,
          clubName: club.name,
        };
      })
    ).then((results) => results.filter((r): r is ShotSuggestion => r !== null));

    // Find the result closest to target carry
    return results.reduce((best, current) => {
      const currentDiff = Math.abs(current.estimatedCarry! - targetCarry);
      const bestDiff = Math.abs(best.estimatedCarry! - targetCarry);
      return currentDiff < bestDiff ? current : best;
    });
  }

  // Try the initially selected club
  let bestResult = await tryClub(bestClubIndex);
  const ACCEPTABLE_DIFF = 5; // 5 meters difference is acceptable

  // If initial result isn't close enough, try one adjacent club
  if (Math.abs(bestResult.estimatedCarry - targetCarry) > ACCEPTABLE_DIFF) {
    if (bestResult.estimatedCarry < targetCarry && bestClubIndex > 0) {
      // Try one stronger club
      const strongerResult = await tryClub(bestClubIndex - 1);
      if (
        Math.abs(strongerResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry)
      ) {
        bestResult = strongerResult;
      }
    } else if (
      bestResult.estimatedCarry > targetCarry &&
      bestClubIndex < clubs.length - 1
    ) {
      // Try one weaker club
      const weakerResult = await tryClub(bestClubIndex + 1);
      if (
        Math.abs(weakerResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry)
      ) {
        bestResult = weakerResult;
      }
    }
  }

  return bestResult;
}
