import { readFile } from "fs/promises";
import { Hono, type Context } from "hono";
import { TrajectoryService } from "./services/database.service";
import { ShotCalculator } from "./services/shot-calculator";
import { SuggestShotService } from "./services/suggest-shot.service";
import type { SuggestShotRequest } from "./types";

const app = new Hono();
const trajectoryService = new TrajectoryService();
const suggestShotService = new SuggestShotService(trajectoryService);
const shotCalculator = new ShotCalculator(trajectoryService);

app.get("/api/materials", async (c) => {
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
app.post("/api/calculate-carry", async (c) => {
  console.log(
    "======================== new calculate-carry request ========================="
  );
  const request: CalculateCarryRequest = await c.req.json();
  const result = await shotCalculator.calculateCarry(
    request.ballSpeed,
    request.spin,
    request.vla,
    request.material,
    request.upDownLie,
    request.rightLeftLie,
    request.elevation,
    request.altitude
  );
  return c.json(result);
});

app.post("/api/suggestShot", async (c) => {
  const request: SuggestShotRequest = await c.req.json();

  console.log(
    "======================== new suggestShot request ========================="
  );
  console.log("suggestShotRequest", request);

  if (typeof request.targetCarry !== "number") {
    return c.json({ error: "Missing or invalid targetCarry " }, 400);
  }

  const suggestion = await suggestShotService.getSuggestion(
    request.targetCarry,
    request.material,
    request.upDownLie ?? 0,
    request.rightLeftLie ?? 0,
    request.elevation ?? 0,
    request.altitude ?? 0
  );
  if (!suggestion) {
    return c.json({ error: "No suitable shot found" }, 404);
  }
  return c.json(suggestion, 200);
});

// Add a simple health check endpoint
app.get("/api/health", (c) => c.json({ status: "ok" }));

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
