import { readFile } from "fs/promises";
import { Hono, type Context } from "hono";
import { TrajectoryService } from "./services/database.service";
import { SuggestShotService } from "./services/suggest-shot.service";

const app = new Hono();
const trajectoryService = new TrajectoryService();
const suggestShotService = new SuggestShotService();

app.get("/trajectory", async (c) => {
  const ballSpeed = Number(c.req.query("ballSpeed"));
  const spin = Number(c.req.query("spin"));
  const vla = Number(c.req.query("vla"));
  console.log("Received request", ballSpeed, spin, vla);

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

    console.log("Result", result);

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
