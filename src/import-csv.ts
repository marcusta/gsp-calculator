import { Database } from "bun:sqlite";
import { parse } from "csv-parse/sync";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function createDatabase() {
  const db = new Database("data/trajectories.db");

  // Create table based on actual CSV structure
  db.run(`
    CREATE TABLE IF NOT EXISTS trajectories (
      BallSpeed REAL,
      VLA REAL,
      HLA REAL,
      BackSpin REAL,
      SpinAxis REAL,
      Carry REAL,
      Offline REAL
    )
  `);

  return db;
}

async function importCSVFiles() {
  const db = await createDatabase();
  const stmt = db.prepare(`
    INSERT INTO trajectories (BallSpeed, VLA, HLA, BackSpin, SpinAxis, Carry, Offline)
    VALUES ($BallSpeed, $VLA, $HLA, $BackSpin, $SpinAxis, $Carry, $Offline)
  `);

  try {
    const files = await readdir("trajectory_data");
    const csvFiles = files.filter((file) => file.endsWith(".csv"));

    for (const file of csvFiles) {
      console.log(`Processing ${file}...`);
      const content = await readFile(join("trajectory_data", file), "utf-8");

      // Parse CSV content with normalized headers
      const records = parse(content, {
        columns: (headers) => headers.map((h: string) => h.trim()),
        skip_empty_lines: true,
      });

      // Debug: Log the first record to see its structure
      if (records.length > 0) {
        console.log("First record structure:", records[0]);
        console.log("Available columns:", Object.keys(records[0]));
      }

      let recordCount = 0;
      // Begin transaction for better performance
      db.transaction(() => {
        for (const record of records) {
          // Debug: Log raw values for the first record
          if (recordCount === 0) {
            console.log("Raw values:", {
              BallSpeed: record["BallSpeed"],
              VLA: record.VLA,
              HLA: record.HLA,
              BackSpin: record.BackSpin,
              SpinAxis: record.SpinAxis,
              Carry: record.Carry,
              Offline: record.Offline,
            });
          }

          const values = {
            $BallSpeed: parseFloat(record["BallSpeed"] || "0"),
            $VLA: parseFloat(record.VLA || "0"),
            $HLA: parseFloat(record.HLA || "0"),
            $BackSpin: parseFloat(record.BackSpin || "0"),
            $SpinAxis: parseFloat(record.SpinAxis || "0"),
            $Carry: parseFloat(record.Carry || "0"),
            $Offline: parseFloat(record.Offline || "0"),
          };

          // Debug: Log parsed values for the first record
          if (recordCount === 0) {
            console.log("Parsed values for first record:", values);
          }

          stmt.run(values);
          recordCount++;
        }
      })();

      console.log(
        `Completed importing ${file} - ${recordCount} records inserted`
      );
    }

    // Show total records in database
    const totalRecords = db
      .query("SELECT COUNT(*) as count FROM trajectories")
      .get() as { count: number };
    console.log(`Total records in database: ${totalRecords.count}`);

    // Debug: Show a sample of records from the database
    const sampleRecords = db.query("SELECT * FROM trajectories LIMIT 3").all();
    console.log("Sample records from database:", sampleRecords);
  } catch (error) {
    console.error("Error importing CSV files:", error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the import
importCSVFiles().catch(console.error);
