import type {
  ShotAnalyzerRequest,
  ShotAnalyzerResponse,
  ShotIncrementResult,
} from "../types";
import { clubs } from "./club-ranges";
import type { TrajectoryService } from "./database.service";
import { calculateTrajectory } from "./trajectory";

export async function analyzeShotWithClub(
  request: ShotAnalyzerRequest,
  trajectoryService: TrajectoryService
): Promise<ShotAnalyzerResponse> {
  const {
    club: clubName,
    material,
    upDownLie,
    rightLeftLie,
    altitude,
    elevation,
    increments,
  } = request;

  const club = clubs.find((c) => c.name === clubName);
  if (!club) {
    throw new Error(`Invalid club: ${clubName}`);
  }

  const speedRange = club.speedMax - club.speedMin;
  const avgSpin = (club.spinMax + club.spinMin) / 2;
  const avgVLA = (club.vlaMax + club.vlaMin) / 2;

  const results: (ShotIncrementResult | null)[] = await Promise.all(
    Array.from({ length: increments }, async (_, i) => {
      const power = i / (increments - 1); // 0 to 1
      const speed = club.speedMin + speedRange * power;

      console.log("avgVLA", avgVLA);

      // Calculate carries
      const estimatedCarryData = await calculateTrajectory(
        {
          material,
          speed,
          spin: avgSpin,
          vla: avgVLA,
          upDownLie,
          rightLeftLie,
          elevation,
          altitude,
        },
        trajectoryService
      );

      if (!estimatedCarryData) {
        return null;
      }

      const rawCarryData = await trajectoryService.findClosestTrajectory(
        speed,
        avgSpin,
        avgVLA
      );

      const result: ShotIncrementResult = {
        power,
        ballSpeed: speed,
        spin: avgSpin,
        vla: avgVLA,
        rawCarry: rawCarryData?.Carry ?? 0,
        estimatedCarry: estimatedCarryData.carry,
        envCarry: estimatedCarryData.envCarry,
        offlineDeviation: estimatedCarryData.offlineDeviation,
        modifiers: {
          speedPenalty: estimatedCarryData.speedPenalty,
          spinPenalty: estimatedCarryData.spinPenalty,
          vlaPenalty: estimatedCarryData.vlaPenalty,
        },
      };

      return result;
    })
  );

  return {
    request,
    results,
  };
}
