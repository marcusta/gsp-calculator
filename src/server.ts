import { readFile } from "fs/promises";
import { Hono, type Context } from "hono";
import { clubs } from "./services/club-ranges";
import { TrajectoryService } from "./services/database.service";
import { analyzeShotWithClub } from "./services/shot-analyzer.service";
import { ShotCalculator } from "./services/shot-calculator";
import { SuggestShotService } from "./services/suggest-shot.service";
import type { ShotAnalyzerRequest, SuggestShotRequest } from "./types";

const app = new Hono();
const trajectoryService = new TrajectoryService();
const suggestShotService = new SuggestShotService(trajectoryService);
const shotCalculator = new ShotCalculator(trajectoryService);

app.get("/api/materials", async (c) => {
  return c.json([
    { name: "fairway", title: "Fairway" },
    { name: "rough", title: "Rough" },
    { name: "sand", title: "Sand" },
    { name: "deeprough", title: "Deep Rough" },
    { name: "semirough", title: "Semi Rough" },
    { name: "pinestraw", title: "Pine Straw" },
    { name: "concrete", title: "Concrete" },
    { name: "tee", title: "Tee" },
    { name: "earth", title: "Earth" },
    { name: "leaves", title: "Leaves" },
    { name: "stone", title: "Stone" },
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

app.post("/api/analyze-club-shot", async (c) => {
  try {
    const request: ShotAnalyzerRequest = await c.req.json();

    // Validate inputs
    if (!request.club || !clubs.some((c) => c.name === request.club)) {
      return c.json({ error: "Invalid club name" }, 400);
    }
    if (request.increments < 1 || request.increments > 7) {
      return c.json({ error: "Increments must be between 1 and 7" }, 400);
    }
    if (!request.material) {
      return c.json({ error: "Material is required" }, 400);
    }

    const result = await analyzeShotWithClub(request, trajectoryService);
    return c.json(result);
  } catch (error) {
    console.error("Error in analyze-club-shot:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add new endpoint for clubs
app.get("/api/clubs", (c) => {
  return c.json(clubs.map((club) => ({ name: club.name })));
});

// Add a simple health check endpoint
app.get("/api/health", (c) => c.json({ status: "ok" }));

async function serveAsset(c: Context) {
  console.log("serving asset", c.req.path);
  try {
    const path = c.req.path
      .replace("/assets/", "")
      .replace("/gsp-calc/assets/", "");

    // Prevent directory traversal attacks
    const normalizedPath = path.split(/[\\/]+/).join("/");
    if (
      normalizedPath.includes("..") ||
      normalizedPath.startsWith("/") ||
      normalizedPath.includes(":")
    ) {
      console.warn("Attempted path traversal attack:", path);
      return c.json({ error: "Invalid asset path" }, 403);
    }

    const filePath = `./public/frontend/assets/${normalizedPath}`;

    const file = await readFile(filePath);

    // Set appropriate content-type based on file extension
    const ext = path.split(".").pop()?.toLowerCase();
    if (ext === "css") c.header("Content-Type", "text/css");
    else if (ext === "js") c.header("Content-Type", "application/javascript");
    else if (ext === "png") c.header("Content-Type", "image/png");
    else if (ext === "jpg" || ext === "jpeg")
      c.header("Content-Type", "image/jpeg");
    else if (ext === "svg") c.header("Content-Type", "image/svg+xml");

    // Handle binary files (images) differently from text files
    if (["png", "jpg", "jpeg"].includes(ext || "")) {
      return new Response(new Uint8Array(file));
    }
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

app.get("/gsp-calc/golfball-small.png", async (c) => {
  console.log("serving golfball-small.png from /gsp-calc/");
  const filePath = "./public/frontend/golfball-small.png";
  const file = await readFile(filePath);
  c.header("Content-Type", "image/png");
  return new Response(new Uint8Array(file));
});

app.get("/golfball-small.png", async (c) => {
  console.log("serving golfball-small.png from /");
  const filePath = "./public/frontend/golfball-small.png";
  const file = await readFile(filePath);
  c.header("Content-Type", "image/png");
  return new Response(new Uint8Array(file));
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
