const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { uploadNirfWorkbook, getNirfHistory } = require("../../controllers/institute/nirf");

const NirfRouter = express.Router();

const nirfUploadDir = path.resolve(__dirname, "../../../public/uploads/nirf");
if (!fs.existsSync(nirfUploadDir)) {
  fs.mkdirSync(nirfUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, nirfUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".xlsx";
    const safeName = path.parse(file.originalname).name.replace(/[^a-z0-9-_]/gi, "_");
    cb(null, `${Date.now()}-${safeName}${ext.toLowerCase()}`);
  }
});

const allowedMimeTypes = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf"
]);

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only PDF, CSV or Excel files are allowed"));
    }
    return cb(null, true);
  },
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

const singleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, message: error.message || "Upload failed" });
    }
    return next();
  });
};

NirfRouter.post("/upload", singleUpload, uploadNirfWorkbook);
NirfRouter.get("/history", getNirfHistory);

module.exports = { NirfRouter };
