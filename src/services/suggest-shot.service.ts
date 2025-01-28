// services/suggestShot.service.ts
import { clubs, type Club } from "./club-ranges";
import { TrajectoryService } from "./database.service";
import { calculateOfflineDeviation } from "./lie-calculation";
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
  offlineAimAdjustment: number; // Positive means aim right, negative means aim left (meters)
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

  // First find the best club based on carry ranges
  let bestClubIndex = -1;
  let bestScore = Infinity;

  clubs.forEach((club, index) => {
    const { minCarry, maxCarry } = getModifiedCarryRange(club);
    // Allow some flexibility in the ranges
    const minAllowed = minCarry * 0.9;
    const maxAllowed = maxCarry * 1.1;

    if (
      environmentModifiedCarryForFindingClub >= minAllowed &&
      environmentModifiedCarryForFindingClub <= maxAllowed
    ) {
      const rangeCenter = (minCarry + maxCarry) / 2;
      const score = Math.abs(
        environmentModifiedCarryForFindingClub - rangeCenter
      );

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

    // Determine number of speed samples based on range size
    const SPEED_RANGE_THRESHOLD = 5; // m/s
    const speeds =
      speedRange <= SPEED_RANGE_THRESHOLD
        ? [club.speedMin, (club.speedMin + club.speedMax) / 2, club.speedMax]
        : [
            club.speedMin,
            club.speedMin + speedRange * 0.33,
            club.speedMin + speedRange * 0.66,
            club.speedMax,
          ];

    const PERFECT_MATCH_THRESHOLD = 2.5; // meters - stop searching if we find a match this close
    let bestModifiedResult: {
      speed: number;
      adjustedSpeed: number;
      adjustedSpin: number;
      modifiedVLA: number;
      carry: number;
    } | null = null;
    let bestDiff = Infinity;

    for (const speed of speeds) {
      const speedPenalty = getRoughSpeedPenalty(material, speed, avgVLA);
      const spinPenalty = getRoughSpinPenalty(material, speed, avgVLA);
      const vlaPenalty = getRoughVLAPenalty(material, speed, avgVLA);

      const adjustedSpeed = speed * speedPenalty;
      const adjustedSpin = avgSpin * spinPenalty;
      const adjustedVLA = avgVLA * vlaPenalty;
      const modifiedVLA = getModifiedLieVla(adjustedVLA, upDownLie);

      const modifiedCarryData = await trajectoryService.findClosestTrajectory(
        adjustedSpeed,
        adjustedSpin,
        modifiedVLA
      );

      if (!modifiedCarryData?.Carry) continue;

      const environmentModifiedCarryForClub =
        calculateNeededEnvironmentModifiedCarry(
          targetCarry,
          elevation,
          altitude,
          { speed: adjustedSpeed, spin: adjustedSpin, vla: modifiedVLA }
        );

      console.log(
        "===> environmentModifiedCarryForClub",
        environmentModifiedCarryForClub
      );
      const currentDiff = Math.abs(
        modifiedCarryData.Carry - environmentModifiedCarryForClub
      );

      // Early exit if we found a very close match
      if (currentDiff <= PERFECT_MATCH_THRESHOLD) {
        bestModifiedResult = {
          speed,
          adjustedSpeed,
          adjustedSpin,
          modifiedVLA,
          carry: modifiedCarryData.Carry,
        };
        break;
      }

      // If this result is worse than our best by a significant margin, skip to next speed
      if (bestModifiedResult && currentDiff > bestDiff * 1.5) continue;

      if (currentDiff < bestDiff) {
        bestDiff = currentDiff;
        bestModifiedResult = {
          speed,
          adjustedSpeed,
          adjustedSpin,
          modifiedVLA,
          carry: modifiedCarryData.Carry,
        };
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
      throw new Error(
        `Failed to get raw trajectory data for club ${club.name}`
      );
    }

    return {
      ballSpeed: bestModifiedResult.adjustedSpeed,
      rawBallSpeed: bestModifiedResult.speed,
      spin: bestModifiedResult.adjustedSpin,
      rawSpin: avgSpin,
      vla: bestModifiedResult.modifiedVLA,
      estimatedCarry: calculateEnvironmentModifiedCarry(
        bestModifiedResult.carry,
        elevation,
        altitude,
        club
      ),
      rawCarry: rawCarryData.Carry,
      clubName: club.name,
      offlineAimAdjustment: 0, // Placeholder, actual calculation will be done later
    };
  }

  // Try the initially selected club
  let bestResult = await tryClub(bestClubIndex);
  const ACCEPTABLE_DIFF = 5; // 5 meters difference is acceptable

  // Only try adjacent club if current result is significantly off
  if (Math.abs(bestResult.estimatedCarry - targetCarry) > ACCEPTABLE_DIFF) {
    if (bestResult.estimatedCarry < targetCarry && bestClubIndex > 0) {
      // Try one stronger club
      console.log("TRY one stronger club");
      const strongerResult = await tryClub(bestClubIndex - 1);
      if (
        Math.abs(strongerResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry) * 0.8 // Only use if significantly better
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
        Math.abs(bestResult.estimatedCarry - targetCarry) * 0.8 // Only use if significantly better
      ) {
        bestResult = weakerResult;
      }
    }
  }

  // Add final adjustment to minimize carry difference
  const carryDiff = targetCarry - bestResult.estimatedCarry;
  if (Math.abs(carryDiff) > 1) {
    // Only adjust if difference is meaningful
    const speedRatio = bestResult.ballSpeed / bestResult.rawBallSpeed;
    const rawCarryAdjustment = carryDiff / speedRatio;

    bestResult = {
      ...bestResult,
      rawCarry: bestResult.rawCarry + rawCarryAdjustment,
      estimatedCarry: targetCarry,
    };
  }

  // Calculate offline deviation based on the right/left lie
  // Negate the value since we want to aim in the opposite direction of the deviation
  const offlineAimAdjustment = -calculateOfflineDeviation(
    bestResult.vla,
    rightLeftLie,
    bestResult.estimatedCarry
  );

  console.log("offlineAimAdjustment", offlineAimAdjustment);

  return {
    ...bestResult,
    offlineAimAdjustment,
  };
}

function calculateEnvironmentModifiedCarry(
  carry: number,
  elevation: number,
  altitude: number,
  club?: Club | { spin: number; vla: number; speed: number }
) {
  const { ballSpeed, spin, vla } = getBallDataFromClub(club);
  const altitudeEffect = getAltitudeModifier(altitude);
  const elevationEffect = getElevationDistanceModifier(
    carry,
    elevation,
    ballSpeed,
    spin,
    vla
  );
  const result = (carry + elevationEffect) * altitudeEffect;
  console.log(
    "===> environmentModifiedCarry",
    result,
    "input carry",
    carry,
    "elevation",
    elevation,
    "altitude",
    altitude
  );
  return result;
}

function calculateNeededEnvironmentModifiedCarry(
  carry: number,
  elevation: number,
  altitude: number,
  club?: Club | { spin: number; vla: number; speed: number }
) {
  const { ballSpeed, spin, vla } = getBallDataFromClub(club);
  const altitudeEffect = getAltitudeModifier(altitude);
  const elevationEffect = getElevationDistanceModifier(
    carry,
    elevation,
    ballSpeed,
    spin,
    vla
  );
  const result = (carry - elevationEffect) / altitudeEffect;
  return result;
}

function getBallDataFromClub(
  club?: Club | { spin: number; vla: number; speed: number }
) {
  let ballSpeed = 120;
  let spin = 5800;
  let vla = 18;
  if (club && "speedMin" in club) {
    ballSpeed = club.speedMin;
    spin = (club.spinMax + club.spinMin) / 2;
    vla = (club.vlaMax + club.vlaMin) / 2;
  } else if (club) {
    ballSpeed = club.speed;
    spin = club.spin;
    vla = club.vla;
  }
  return { ballSpeed, spin, vla };
}
