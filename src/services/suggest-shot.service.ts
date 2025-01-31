// services/suggestShot.service.ts
import type { ShotSuggestion } from "../../gsp-calculator/src/api";
import { guessClub, tryClub } from "./club";
import { clubs } from "./club-ranges";
import { TrajectoryService } from "./database.service";

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
  const clubGuess = guessClub(targetCarry, material, elevation, altitude);

  let bestResult = await tryClub(
    clubGuess.club,
    targetCarry,
    material,
    upDownLie,
    rightLeftLie,
    elevation,
    altitude,
    trajectoryService
  );

  const ACCEPTABLE_DIFF = 5; //meters

  if (Math.abs(bestResult.estimatedCarry - targetCarry) > ACCEPTABLE_DIFF) {
    let strongerOrWeakerClubIndex = 0;
    if (bestResult.estimatedCarry < targetCarry && clubGuess.clubIndex > 0) {
      strongerOrWeakerClubIndex = -1;
    } else if (
      bestResult.estimatedCarry > targetCarry &&
      clubGuess.clubIndex < clubs.length - 1
    ) {
      strongerOrWeakerClubIndex = 1;
    }
    if (strongerOrWeakerClubIndex !== 0) {
      const newClub = clubs[clubGuess.clubIndex + strongerOrWeakerClubIndex];
      console.log(
        "!!!! Trying different club",
        newClub.name,
        " strongerOrWeaker: ",
        strongerOrWeakerClubIndex
      );
      const newResult = await tryClub(
        newClub,
        targetCarry,
        material,
        upDownLie,
        rightLeftLie,
        elevation,
        altitude,
        trajectoryService
      );
      if (
        Math.abs(newResult.estimatedCarry - targetCarry) <
        Math.abs(bestResult.estimatedCarry - targetCarry) * 0.8 // Only use if significantly better
      ) {
        console.log("!!!! Using new result");
        bestResult = newResult;
      }
    }
  }

  const carryDiff = targetCarry - bestResult.estimatedCarry;
  if (Math.abs(carryDiff) > 1) {
    const speedRatio = bestResult.ballSpeed / bestResult.rawBallSpeed;
    const rawCarryAdjustment = carryDiff / speedRatio;

    bestResult = {
      ...bestResult,
      rawCarry: bestResult.rawCarry + rawCarryAdjustment,
      estimatedCarry: targetCarry,
    };
  }

  return {
    ...bestResult,
  };
}
