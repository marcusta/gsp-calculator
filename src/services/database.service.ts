import { Database } from "bun:sqlite";

export class TrajectoryService {
  private db: Database;

  constructor() {
    this.db = new Database("data/trajectories.db");
  }

  async findClosestTrajectory(ballSpeed: number, spin: number, vla: number) {
    // First find the closest matches for spin and VLA, then get the nearest ball speeds
    const query = `
      WITH SpinVlaMatches AS (
        SELECT 
          *,
          ABS(BackSpin - $spin) / 200.0 + ABS(VLA - $vla) / 2.0 as match_score
        FROM trajectories
        ORDER BY match_score ASC
        LIMIT 1
      ),
      -- Find the closest ball speed below
      BelowSpeed AS (
        SELECT *
        FROM trajectories t
        WHERE t.BallSpeed <= $ballSpeed
        AND t.BackSpin = (SELECT BackSpin FROM SpinVlaMatches)
        AND t.VLA = (SELECT VLA FROM SpinVlaMatches)
        ORDER BY t.BallSpeed DESC
        LIMIT 1
      ),
      -- Find the closest ball speed above
      AboveSpeed AS (
        SELECT *
        FROM trajectories t
        WHERE t.BallSpeed >= $ballSpeed
        AND t.BackSpin = (SELECT BackSpin FROM SpinVlaMatches)
        AND t.VLA = (SELECT VLA FROM SpinVlaMatches)
        ORDER BY t.BallSpeed ASC
        LIMIT 1
      )
      SELECT 
        b.BallSpeed as below_speed,
        b.Carry as below_carry,
        a.BallSpeed as above_speed,
        a.Carry as above_carry,
        b.VLA,
        b.HLA,
        b.BackSpin,
        b.SpinAxis,
        b.Offline
      FROM BelowSpeed b
      LEFT JOIN AboveSpeed a ON 1=1
    `;

    const result = this.db.prepare(query).get({
      $ballSpeed: ballSpeed,
      $spin: spin,
      $vla: vla,
    }) as InterpolationResult | undefined;

    if (!result) {
      return undefined;
    }

    // If we only found one match (exactly at the requested speed or at a boundary)
    if (!result.above_speed || !result.below_speed) {
      return {
        BallSpeed: result.below_speed || result.above_speed,
        VLA: result.VLA,
        HLA: result.HLA,
        BackSpin: result.BackSpin,
        SpinAxis: result.SpinAxis,
        Carry: result.below_carry || result.above_carry,
        Offline: result.Offline,
      };
    }

    // Perform linear interpolation for Carry
    const interpolatedCarry = this.lerp(
      result.below_carry,
      result.above_carry,
      (ballSpeed - result.below_speed) /
        (result.above_speed - result.below_speed)
    );

    console.log(
      "Finding closest trajectory for BS: ",
      ballSpeed,
      "SPIN: ",
      spin,
      "VLA: ",
      vla,
      " result: ",
      interpolatedCarry
    );

    return {
      BallSpeed: ballSpeed, // Use requested ball speed
      VLA: result.VLA,
      HLA: result.HLA,
      BackSpin: result.BackSpin,
      SpinAxis: result.SpinAxis,
      Carry: interpolatedCarry,
      Offline: result.Offline,
    };
  }

  async findTrajectoryInRange(params: {
    ballSpeedMin: number;
    ballSpeedMax: number;
    spinMin: number;
    spinMax: number;
    vlaMin: number;
    vlaMax: number;
    targetCarry: number;
    material: string;
  }) {
    const query = `
    WITH ValidShots AS (
      SELECT 
        *,
        CASE 
          WHEN '${params.material}' IN ('fairway', 'tee') THEN Carry
          ELSE ${params.material}_carry 
        END as material_carry,
        ABS(Carry - $targetCarry) as carry_diff  -- Look at base carry for matching
      FROM trajectories
      WHERE 
        BallSpeed BETWEEN $ballSpeedMin AND $ballSpeedMax
        AND BackSpin BETWEEN $spinMin AND $spinMax
        AND VLA BETWEEN $vlaMin AND $vlaMax
        AND (
          CASE 
            WHEN '${params.material}' IN ('fairway', 'tee') THEN Carry
            ELSE ${params.material}_carry 
          END IS NOT NULL
          AND CASE 
            WHEN '${params.material}' IN ('fairway', 'tee') THEN Carry
            ELSE ${params.material}_carry 
          END > 0
        )
    )
    SELECT 
      BallSpeed,
      VLA,
      HLA,
      BackSpin,
      SpinAxis,
      Carry,
      Offline,
      material_carry
    FROM ValidShots
    ORDER BY carry_diff ASC
    LIMIT 1
  `;

    try {
      const result = this.db.prepare(query).get({
        $ballSpeedMin: params.ballSpeedMin,
        $ballSpeedMax: params.ballSpeedMax,
        $spinMin: params.spinMin,
        $spinMax: params.spinMax,
        $vlaMin: params.vlaMin,
        $vlaMax: params.vlaMax,
        $targetCarry: params.targetCarry,
      });

      return result;
    } catch (error) {
      console.error("Error in findTrajectoryInRange:", error);
      return undefined;
    }
  }

  async findOptimalLength(ballSpeed: number, maxVLA?: number) {
    const params = {
      $ballSpeed: ballSpeed,
      $maxVLA: maxVLA ?? null, // Convert undefined to null
    };

    const query = `
      WITH ValidTrajectories AS (
        SELECT 
          BallSpeed,
          VLA,
          BackSpin,
          Carry,
          HLA,
          SpinAxis,
          Offline,
          CASE 
            WHEN $maxVLA IS NOT NULL AND VLA > $maxVLA THEN -999999
            ELSE 0 
          END as vla_penalty
        FROM trajectories
        WHERE ABS(BallSpeed - $ballSpeed) < 0.1
      )
      SELECT 
        BallSpeed,
        VLA,
        BackSpin,
        Carry,
        HLA,
        SpinAxis,
        Offline
      FROM ValidTrajectories
      ORDER BY Carry + vla_penalty DESC
      LIMIT 1
    `;

    const result = this.db.prepare(query).get(params) as
      | TrajectoryResult
      | undefined;
    return result;
  }

  private lerp(start: number, end: number, t: number): number {
    if (start === end) {
      return start;
    }
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }

  close() {
    this.db.close();
  }
}

interface InterpolationResult {
  below_speed: number;
  above_speed: number;
  below_carry: number;
  above_carry: number;
  VLA: number;
  HLA: number;
  BackSpin: number;
  SpinAxis: number;
  Offline: number;
}

export interface TrajectoryResult {
  BallSpeed: number;
  VLA: number;
  HLA: number;
  BackSpin: number;
  SpinAxis: number;
  Carry: number;
  Offline: number;
}
