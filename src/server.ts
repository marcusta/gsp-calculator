import { Hono } from "hono";
import { TrajectoryService } from "./services/database.service";
import { SuggestShotService } from "./services/suggest-shot.service";

const app = new Hono();
const trajectoryService = new TrajectoryService();
const suggestShotService = new SuggestShotService();

app.get("/trajectory", async (c) => {
  console.log("Received request");
  const ballSpeed = Number(c.req.query("ballSpeed"));
  const spin = Number(c.req.query("spin"));
  const vla = Number(c.req.query("vla"));

  // Validate inputs
  if (isNaN(ballSpeed) || isNaN(spin) || isNaN(vla)) {
    return c.json(
      {
        error:
          "Invalid parameters. ballSpeed, spin, and vla are required numbers",
      },
      400
    );
  }

  // Validate ranges
  if (
    ballSpeed < 2 ||
    ballSpeed > 200 ||
    spin < 200 ||
    spin > 12000 ||
    vla < 4 ||
    vla > 50
  ) {
    return c.json(
      {
        error: "Parameters out of range",
        validRanges: {
          ballSpeed: "2-200",
          spin: "200-12000",
          vla: "4-50",
        },
      },
      400
    );
  }

  try {
    const result = await trajectoryService.findClosestTrajectory(
      ballSpeed,
      spin,
      vla
    );

    if (!result) {
      return c.json({ error: "No matching trajectory found" }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error finding trajectory:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/suggestShot", async (c) => {
  let body: {
    targetCarry: number;
    clubId: number;
    materialIndex?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { targetCarry, clubId, materialIndex } = body;

  if (typeof targetCarry !== "number" || typeof clubId !== "number") {
    return c.json({ error: "Missing or invalid targetCarry or clubId" }, 400);
  }

  try {
    const suggestion = await suggestShotService.getSuggestion(
      targetCarry,
      clubId,
      materialIndex
    );
    if (!suggestion) {
      return c.json({ error: "No suitable shot found" }, 404);
    }
    return c.json(suggestion, 200);
  } catch (err) {
    console.error("Error in getSuggestion:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a simple health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Handle graceful shutdown
process.on("SIGTERM", () => {
  trajectoryService.close();
  process.exit(0);
});

export default app;
