const fs = require("fs");
const path = require("path");

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves base64 string or data URL to server disk in ./uploads/
 * Returns relative public URL path e.g. "/uploads/1724859000_receipt.png"
 */
function saveFileToDisk(dataUrl, originalName = "uploaded_file") {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl || "";

  // If it's already a URL path (e.g. starting with /uploads/ or http), return as is
  if (dataUrl.startsWith("/uploads/") || dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    return dataUrl;
  }

  // Check if string is base64 Data URL format (data:mime/type;base64,...)
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return dataUrl; // Not base64, return original
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Determine file extension
  let ext = "bin";
  if (mimeType.includes("pdf")) ext = "pdf";
  else if (mimeType.includes("png")) ext = "png";
  else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
  else if (mimeType.includes("word") || mimeType.includes("document")) ext = "docx";
  else if (mimeType.includes("zip")) ext = "zip";
  else {
    const extMatch = originalName.split(".").pop();
    if (extMatch && extMatch !== originalName) ext = extMatch.toLowerCase();
  }

  // Create safe unique filename
  const cleanName = (originalName || "file").replace(/[^a-zA-Z0-9_\.-]/g, "_");
  const fileName = `${Date.now()}_${cleanName.endsWith(`.${ext}`) ? cleanName : `${cleanName}.${ext}`}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Write file bytes directly to server disk
  fs.writeFileSync(filePath, buffer);

  // Return public URL path
  return `/uploads/${fileName}`;
}

module.exports = { saveFileToDisk, UPLOADS_DIR };
