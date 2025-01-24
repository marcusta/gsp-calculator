import { Database } from "bun:sqlite";
import { TrajectoryService } from "./services/database.service";
import {
  getRoughSpeedPenaltyForVLA,
  getRoughSpinPenalty,
  getRoughVLAPenalty,
} from "./services/penalty";

const materialsTable = {
  semirough: { name: "semirough", offset1: 32, offset2: 20 },
  fairway: { name: "fairway", offset1: 48, offset2: 47 },
  tee: { name: "tee", offset1: 48, offset2: 47 },
  rough: { name: "rough", offset1: 0, offset2: 0 },
  earth: { name: "earth", offset1: 0, offset2: 0 },
  pinestraw: { name: "pinestraw", offset1: 0, offset2: 0 },
  leaves: { name: "leaves", offset1: 0, offset2: 0 },
  deeprough: { name: "deeprough", offset1: 16, offset2: 10 },
  concrete: { name: "concrete", offset1: 48, offset2: 30 },
  stone: { name: "stone", offset1: 48, offset2: 30 },
  sand: { name: "sand", offset1: 64, offset2: 40 },
};

interface TrajectoryRow {
  BallSpeed: number;
  VLA: number;
  BackSpin: number;
  Carry: number;
  [key: string]: number; // For material carries
}

async function main() {
  const db = new Database("data/trajectories.db");
  const trajectoryService = new TrajectoryService(db);
  const BATCH_SIZE = 1000;

  try {
    const totalRows = db
      .prepare("SELECT COUNT(*) as count FROM trajectories")
      .get() as { count: number };
    console.log(`Total rows to process: ${totalRows.count}`);

    // Prepare the update statement once
    const updateStmt = db.prepare(`
      UPDATE trajectories 
      SET ${Object.keys(materialsTable)
        .map((m) => `${m}_carry = @${m}_carry`)
        .join(", ")}
      WHERE BallSpeed = @BallSpeed 
        AND VLA = @VLA 
        AND BackSpin = @BackSpin
    `);

    let offset = 0;
    let processedRows = 0;

    while (true) {
      // Begin transaction for batch
      const transaction = db.transaction(async () => {
        const rows = db
          .prepare(
            `
          SELECT BallSpeed, VLA, BackSpin, Carry 
          FROM trajectories
          LIMIT @limit OFFSET @offset
        `
          )
          .all({
            limit: BATCH_SIZE,
            offset: offset,
          }) as TrajectoryRow[];

        if (rows.length === 0) return false;

        for (const row of rows) {
          const updates = { ...row };
          for (const material of Object.keys(materialsTable)) {
            // Calculate carries for each material
            const speedPenalty = getRoughSpeedPenaltyForVLA(material, row.VLA);
            const spinPenalty = getRoughSpinPenalty(
              material,
              row.BallSpeed,
              row.VLA
            );
            const vlaPenalty = getRoughVLAPenalty(
              material,
              row.BallSpeed,
              row.VLA
            );

            const modifiedBallSpeed = row.BallSpeed * speedPenalty;
            const modifiedVLA = row.VLA * vlaPenalty;
            const modifiedBackSpin = row.BackSpin * spinPenalty;

            const result = await trajectoryService.findClosestTrajectory(
              modifiedBallSpeed,
              modifiedBackSpin,
              modifiedVLA
            );
            updates[`${material}_carry`] = result?.Carry ?? 0;
          }
          updateStmt.run(updates);
        }
        return true;
      });

      const hasMore = transaction();
      if (!hasMore) break;

      offset += BATCH_SIZE;
      processedRows += BATCH_SIZE;
      console.log(`Processed ${processedRows} of ${totalRows.count} rows...`);
    }

    console.log(
      `Database update completed successfully, processed ${processedRows} rows`
    );
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  } finally {
    db.close();
  }
}

main().catch(console.error);
