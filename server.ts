import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve public uploads statically directly from Express
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(process.cwd(), "public")));

let inMemoryStore: Record<string, any> = {};

// Load existing store from disk on boot if present
try {
  if (fs.existsSync(STORE_FILE)) {
    const fileContent = fs.readFileSync(STORE_FILE, "utf-8");
    inMemoryStore = JSON.parse(fileContent);
  }
} catch (e) {
  console.warn("Could not parse existing store.json on boot:", e);
}

// API Routes
app.get("/api/store", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    if (Object.keys(inMemoryStore).length > 0) {
      return res.json(inMemoryStore);
    }
    if (fs.existsSync(STORE_FILE)) {
      const fileData = fs.readFileSync(STORE_FILE, "utf-8");
      inMemoryStore = JSON.parse(fileData);
      return res.json(inMemoryStore);
    }
    return res.json({ status: "empty" });
  } catch (error) {
    console.error("Error reading store:", error);
    return res.status(500).json({ error: "Failed to load stored data" });
  }
});

app.post("/api/store", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    inMemoryStore = { ...inMemoryStore, ...payload };
    fs.writeFileSync(STORE_FILE, JSON.stringify(inMemoryStore, null, 2), "utf-8");
    console.log("Global store saved successfully to data/store.json");
    return res.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("Error saving store:", error);
    return res.status(500).json({ error: "Failed to save data" });
  }
});

app.post(["/api/upload-image", "/api/upload"], (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  try {
    const { image, data, file, filename: customFilename, name } = req.body;
    const rawData = image || data || file;
    if (!rawData || typeof rawData !== "string") {
      return res.status(400).json({ error: "No image or file data provided" });
    }

    // Determine extension and base64 payload
    let ext = "jpg";
    let base64Data = rawData;

    const matches = rawData.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1];
      base64Data = matches[2];
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      else if (mime.includes("svg")) ext = "svg";
      else if (mime.includes("mp4")) ext = "mp4";
      else if (mime.includes("webm")) ext = "webm";
      else ext = "jpg";
    }

    const safeName = (name || customFilename || "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalFileName = safeName ? `${safeName}_${uniqueSuffix}.${ext}` : `img_${uniqueSuffix}.${ext}`;

    const filePath = path.join(UPLOADS_DIR, finalFileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    const publicUrl = `/uploads/${finalFileName}`;
    console.log(`Image saved to ${filePath} -> accessible at ${publicUrl}`);

    return res.json({
      success: true,
      url: publicUrl,
      filename: finalFileName
    });
  } catch (err) {
    console.error("Error saving uploaded image:", err);
    return res.status(500).json({ error: "Failed to save image on server" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
