require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Serve uploaded files statically from ./uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Force-download endpoint: GET /api/download?file=/uploads/username/file.pdf
app.get("/api/download", (req, res) => {
  const filePath = req.query.file;
  if (!filePath || typeof filePath !== "string" || !filePath.startsWith("/uploads/")) {
    return res.status(400).json({ success: false, message: "Invalid file path" });
  }
  // Convert URL path to absolute disk path
  const relativePath = filePath.replace(/^\/uploads\//, "");
  const absolutePath = path.join(__dirname, "../uploads", relativePath);
  // Security: prevent directory traversal
  const uploadsDir = path.resolve(path.join(__dirname, "../uploads"));
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(uploadsDir)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  const fileName = req.query.name || path.basename(absolutePath);
  res.download(resolved, fileName, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, message: "File not found" });
    }
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/assignments", require("./routes/documents"));
app.use("/api/payments", require("./routes/payments"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Simply API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Simply API running on port ${PORT}`);
});
