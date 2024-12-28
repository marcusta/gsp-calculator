import { Database } from "bun:sqlite";

function removeColumns(databasePath: string) {
  // Connect to the database
  const db = new Database(databasePath);

  try {
    // Start a transaction
    db.transaction(() => {
      // 5. Rename the new table to the original name
      db.run("ALTER TABLE trajectory DROP column HLA");
      db.run("ALTER TABLE trajectory DROP column SpinAxis");

      console.log("Successfully removed HLA and spinaxis columns");
    })();
  } catch (e) {
    console.error("An error occurred:", e);
    throw e;
  } finally {
    // Close the database connection
    db.close();
  }
}

// Replace with your database path
const databasePath = "data/trajectory.db";
removeColumns(databasePath);
