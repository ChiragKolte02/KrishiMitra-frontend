import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist
app.use(express.static(path.join(__dirname, "dist")));

// Handle React routing, return index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server on 0.0.0.0 (required for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
});
