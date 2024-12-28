// services/suggestShot.service.ts
import { Database } from "bun:sqlite";
import { clubRanges } from "./club-ranges";
import {
  getRoughSpeedPenalty,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./penalty";

interface TrajectoryRow {
  BallSpeed: number;
  VLA: number;
  Backspin: number; // also called BackSpin in your code
  Carry: number;
}

export class SuggestShotService {
  private db: Database;

  constructor() {
    this.db = new Database("data/trajectories.db");
  }

  /**
   * Main function that the route will call.
   *
   * @param targetCarry   desired carry distance (meters or yards)
   * @param clubId        index in clubRanges, or your own identifier
   * @param materialIndex optional for rough/fairway penalty
   * @returns A single "best" shot object or undefined if none found
   */
  public async getSuggestion(
    targetCarry: number,
    clubId: number,
    materialIndex?: number
  ): Promise<ShotSuggestion | undefined> {
    // 1) Validate the club ID
    const club = clubRanges[clubId];
    if (!club) {
      console.warn(`No club found at index ${clubId}`);
      return undefined;
    }

    // 2) Query the DB for rows in plausible range for THIS club
    //    We’ll filter by the known speed/spin/VLA min/max
    const sql = `
      SELECT
        BallSpeed, VLA, Backspin, Carry
      FROM trajectories
      WHERE 
        BallSpeed >= $speedMin
        AND BallSpeed <= $speedMax
        AND VLA >= $vlaMin
        AND VLA <= $vlaMax
        AND Backspin >= $spinMin
        AND Backspin <= $spinMax
    `;
    const rows: TrajectoryRow[] = this.db.query(sql).all({
      $speedMin: club.speedMin,
      $speedMax: club.speedMax,
      $vlaMin: club.vlaMin,
      $vlaMax: club.vlaMax,
      $spinMin: club.spinMin,
      $spinMax: club.spinMax,
    }) as TrajectoryRow[];

    if (!rows.length) {
      console.warn(`No matching rows in DB for club ${club.name}`);
      return undefined;
    }

    // 3) Search for the row whose "penalty-adjusted" carry is closest to target
    let bestMatch: ShotSuggestion | null = null;
    let bestDiff = Infinity;

    for (const row of rows) {
      // compute penalty if needed
      let modSpeed = row.BallSpeed;
      let modSpin = row.Backspin;
      let modVLA = row.VLA;

      if (materialIndex !== undefined) {
        const speedPenalty = getRoughSpeedPenalty(
          materialIndex,
          row.BallSpeed,
          row.VLA
        );
        const spinPenalty = getRoughSpinPenalty(
          materialIndex,
          row.BallSpeed,
          row.VLA
        );
        const vlaPenalty = getRoughVLAPenalty(
          materialIndex,
          row.BallSpeed,
          row.VLA
        );

        modSpeed *= speedPenalty;
        modSpin *= spinPenalty;
        modVLA *= vlaPenalty;
      }

      // Now that we have "adjusted" speed/spin/VLA,
      // we do a second lookup to find the carry for those new, modified values.

      const adjustedCarry = await this.findClosestCarry(
        modSpeed,
        modSpin,
        modVLA
      );

      const diff = Math.abs(adjustedCarry - targetCarry);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = {
          rawBallSpeed: row.BallSpeed,
          rawSpin: row.Backspin,
          rawVLA: row.VLA,
          rawCarry: row.Carry,

          finalBallSpeed: modSpeed,
          finalSpin: modSpin,
          finalVLA: modVLA,
          finalCarry: adjustedCarry,
          diffFromTarget: diff,
        };
      }

      if (bestDiff < 1) {
        // close enough, break early if you want
        break;
      }
    }

    return bestMatch ?? undefined;
  }

  /**
   * Looks up or interpolates the carry for given speed/spin/vla in the DB.
   * Similar to your existing "findClosestTrajectory".
   */
  private async findClosestCarry(
    ballSpeed: number,
    spin: number,
    vla: number
  ): Promise<number> {
    // We can reuse your existing approach with a single query that picks
    // the closest row(s) by speed, spin, vla. Here’s a simplified example:

    // 1) Constrain to valid ranges for the DB
    if (ballSpeed < 30) ballSpeed = 30;
    if (ballSpeed > 180) ballSpeed = 180;
    if (spin < 1200) spin = 1200;
    if (spin > 12000) spin = 12000;
    if (vla < 10) vla = 10;
    if (vla > 40) vla = 40;

    // 2) Let’s do something akin to your interpolation logic:
    const row = this.db
      .prepare(
        `
        WITH SpinVlaMatches AS (
          SELECT *,
          ABS(Backspin - $spin) / 200.0 + ABS(VLA - $vla) / 2.0 as match_score
          FROM trajectories
          ORDER BY match_score ASC
          LIMIT 1
        ),
        BelowSpeed AS (
          SELECT *
          FROM trajectories t
          WHERE t.BallSpeed <= $speed
          AND t.Backspin = (SELECT Backspin FROM SpinVlaMatches)
          AND t.VLA = (SELECT VLA FROM SpinVlaMatches)
          ORDER BY t.BallSpeed DESC
          LIMIT 1
        ),
        AboveSpeed AS (
          SELECT *
          FROM trajectories t
          WHERE t.BallSpeed >= $speed
          AND t.Backspin = (SELECT Backspin FROM SpinVlaMatches)
          AND t.VLA = (SELECT VLA FROM SpinVlaMatches)
          ORDER BY t.BallSpeed ASC
          LIMIT 1
        )
        SELECT 
          b.BallSpeed as below_speed,
          b.Carry as below_carry,
          a.BallSpeed as above_speed,
          a.Carry as above_carry
        FROM BelowSpeed b
        LEFT JOIN AboveSpeed a ON 1=1
      `
      )
      .get({
        $speed: ballSpeed,
        $spin: spin,
        $vla: vla,
      }) as
      | {
          below_speed: number | null;
          below_carry: number | null;
          above_speed: number | null;
          above_carry: number | null;
        }
      | undefined;

    if (!row) {
      return 0;
    }

    // If we only found one match, or if the speeds are identical
    if (
      !row.above_speed ||
      !row.below_speed ||
      row.above_speed === row.below_speed
    ) {
      // Just return whichever carry is present
      return row.below_carry ?? row.above_carry ?? 0;
    }

    // otherwise, linear interpolation
    const t =
      (ballSpeed - row.below_speed) / (row.above_speed - row.below_speed);

    const carry = this.lerp(row.below_carry ?? 0, row.above_carry ?? 0, t);
    return carry;
  }

  private lerp(start: number, end: number, ratio: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, ratio));
  }

  public close() {
    this.db.close();
  }
}

export interface ShotSuggestion {
  rawBallSpeed: number; // The "unpenalized" row's speed
  rawSpin: number; // The "unpenalized" row's spin
  rawVLA: number;
  rawCarry: number; // direct from DB
  finalBallSpeed: number; // after penalty
  finalSpin: number;
  finalVLA: number;
  finalCarry: number; // after penalty, from interpolation
  diffFromTarget: number;
}
