import type { CalculateCarryResponse, ShotResult } from "../types";
import type { TrajectoryService } from "./database.service";
import { calculateTrajectory } from "./trajectory";

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
  ): Promise<CalculateCarryResponse | null> {
    const result: ShotResult | null = await calculateTrajectory(
      {
        material,
        speed: ballSpeed,
        spin,
        vla,
        upDownLie,
        rightLeftLie,
        elevation,
        altitude,
      },
      this.trajectoryService
    );

    if (!result) {
      return null;
    }

    const rawCarry = await this.trajectoryService.findClosestTrajectory(
      ballSpeed,
      spin,
      vla
    );

    return {
      material: material,
      rawSpin: result.spin,
      rawVLA: result.vla,
      rawSpeed: ballSpeed,
      carryRaw: rawCarry?.Carry ?? 0,
      carryModified: result.carry,
      envCarry: result.envCarry,
      offlineDeviation: result.offlineDeviation,
      vlaModified: result.adjustedVLA,
      spinModified: result.adjustedSpin,
      speedModified: result.adjustedSpeed,
      speedPenalty: result.speedPenalty,
      spinPenalty: result.spinPenalty,
      vlaPenalty: result.vlaPenalty,
    };
  }
}
