import { readFile } from "fs/promises";
import { Hono, type Context } from "hono";
import { TrajectoryService } from "./services/database.service";
import { ShotCalculator } from "./services/shot-calculator";
import { SuggestShotService } from "./services/suggest-shot.service";

const app = new Hono();
const trajectoryService = new TrajectoryService();
const suggestShotService = new SuggestShotService(trajectoryService);
const shotCalculator = new ShotCalculator(trajectoryService);

app.get("/materials", async (c) => {
  return c.json([
    { name: "semirough", title: "Semi Rough" },
    { name: "fairway", title: "Fairway" },
    { name: "tee", title: "Tee" },
    { name: "rough", title: "Rough" },
    { name: "earth", title: "Earth" },
    { name: "pinestraw", title: "Pine Straw" },
    { name: "leaves", title: "Leaves" },
    { name: "deeprough", title: "Deep Rough" },
    { name: "concrete", title: "Concrete" },
    { name: "stone", title: "Stone" },
    { name: "sand", title: "Sand" },
  ]);
});

interface CalculateCarryRequest {
  ballSpeed: number;
  spin: number;
  vla: number;
  material: string;
  upDownLie?: number;
  rightLeftLie?: number;
  elevation?: number;
  altitude?: number;
}
app.post("/calculate-carry", async (c) => {
  const body: CalculateCarryRequest = await c.req.json();
  const {
    ballSpeed,
    spin,
    vla,
    upDownLie,
    rightLeftLie,
    material,
    elevation,
    altitude,
  } = body;
  const result = await shotCalculator.calculateCarry(
    ballSpeed,
    spin,
    vla,
    material,
    upDownLie,
    rightLeftLie,
    elevation,
    altitude
  );
  return c.json(result);
});

interface SuggestShotRequest {
  targetCarry: number;
  material: string;
  upDownLie?: number;
  rightLeftLie?: number;
  elevation?: number;
  altitude?: number;
}
app.post("/suggestShot", async (c) => {
  let body: SuggestShotRequest = await c.req.json();

  const {
    targetCarry,
    material,
    upDownLie,
    rightLeftLie,
    elevation,
    altitude,
  } = body;

  console.log("======================== new request =========================");
  console.log(
    "targetCarry",
    targetCarry,
    "material",
    material,
    "upDownLie",
    upDownLie,
    "rightLeftLie",
    rightLeftLie,
    "elevation",
    elevation,
    "altitude",
    altitude
  );

  if (typeof targetCarry !== "number") {
    return c.json({ error: "Missing or invalid targetCarry " }, 400);
  }

  const suggestion = await suggestShotService.getSuggestion(
    targetCarry,
    material,
    upDownLie ?? 0,
    rightLeftLie ?? 0,
    elevation ?? 0,
    altitude ?? 0
  );
  if (!suggestion) {
    return c.json({ error: "No suitable shot found" }, 404);
  }
  return c.json(suggestion, 200);
});

app.get("/optimize-length", async (c) => {
  const ballSpeed = Number(c.req.query("ballSpeed"));
  const maxVLA = c.req.query("maxVLA")
    ? Number(c.req.query("maxVLA"))
    : undefined;

  // Validate input
  if (isNaN(ballSpeed)) {
    return c.json(
      {
        error: "Invalid parameter. ballSpeed is required and must be a number",
      },
      400
    );
  }

  if (maxVLA !== undefined && isNaN(maxVLA)) {
    return c.json(
      {
        error: "Invalid parameter. maxVLA must be a number if provided",
      },
      400
    );
  }

  // Validate ranges
  if (ballSpeed < 2 || ballSpeed > 200) {
    return c.json(
      {
        error: "Ball speed out of range",
        validRange: "2-200 mph",
      },
      400
    );
  }

  if (maxVLA !== undefined && (maxVLA < 4 || maxVLA > 50)) {
    return c.json(
      {
        error: "Max VLA out of range",
        validRange: "4-50 degrees",
      },
      400
    );
  }

  try {
    const result = await trajectoryService.findOptimalLength(ballSpeed, maxVLA);

    if (!result) {
      return c.json({ error: "No matching trajectory found" }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error finding optimal trajectory:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a simple health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

async function serveAsset(c: Context) {
  try {
    const path = c.req.path
      .replace("/assets/", "")
      .replace("/gsp-calc/assets/", "");
    const filePath = `./public/frontend/assets/${path}`;
    const file = await readFile(filePath);

    // Set appropriate content-type based on file extension
    const ext = path.split(".").pop()?.toLowerCase();
    if (ext === "css") c.header("Content-Type", "text/css");
    else if (ext === "js") c.header("Content-Type", "application/javascript");
    else if (ext === "png") c.header("Content-Type", "image/png");
    else if (ext === "jpg" || ext === "jpeg")
      c.header("Content-Type", "image/jpeg");
    else if (ext === "svg") c.header("Content-Type", "image/svg+xml");

    return c.body(file.toString());
  } catch (error) {
    console.error("Asset not found:", error);
    return c.json({ error: "Asset not found" }, 404);
  }
}

// Serve static assets
app.get("/assets/*", async (c) => {
  return serveAsset(c);
});

app.get("/gsp-calc/assets/*", async (c) => {
  return serveAsset(c);
});

// Catch-all route to serve index.html
app.all("*", async (c) => {
  try {
    const html = await readFile("./public/frontend/index.html");
    c.header("Content-Type", "text/html");
    return c.body(html.toString());
  } catch (error) {
    console.error("Could not load index.html:", error);
    return c.json({ error: "Could not load index.html" }, 500);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  trajectoryService.close();
  process.exit(0);
});

export default app;
