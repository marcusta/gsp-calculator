import Database from "bun:sqlite";

async function cleanDatabase() {
  const db = new Database("data/trajectories.db");

  try {
    console.log("Starting database cleanup...");

    // Delete rows where HLA is not 0
    const deleteHLAQuery = `
            DELETE FROM trajectories 
            WHERE HLA != 0
        `;

    // Delete rows where spin_axis is not 0
    const deleteSpinQuery = `
            DELETE FROM trajectories 
            WHERE SpinAxis != 0
        `;

    // Execute the cleanup queries
    db.run(deleteHLAQuery);
    db.run(deleteSpinQuery);

    // Get the remaining row count
    const countQuery = "SELECT COUNT(*) as count FROM trajectories";
    const result = db.prepare(countQuery).get() as { count: number };

    console.log(`Cleanup complete. Remaining rows: ${result.count}`);
  } catch (error) {
    console.error("Error during database cleanup:", error);
  } finally {
    db.close();
  }
}

// Run the cleanup
cleanDatabase().catch(console.error);
