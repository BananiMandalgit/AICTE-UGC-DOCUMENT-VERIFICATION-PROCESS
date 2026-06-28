const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const { InstitueAuth } = require("./auth");
const { InstitueData } = require("./data");
const { NirfRouter } = require("./nirf");
const prisma = require("../../utils/db");

const InstitueRouter = express.Router();

const multer = require("multer");
const uploadDir = path.resolve(__dirname, "../../../public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}${ext.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// Simple fake auth middleware for dev
const fakeAuth = (req, res, next) => {
  // Skip actual auth in dev
  next();
};

// File upload route
const singleUpload = upload.single("file");

InstitueRouter.post("/upload-document", fakeAuth, (req, res) => {
  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Upload failed." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file was uploaded." });
    }

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully.",
      filePath: `http://localhost:3100/uploads/${req.file.filename}`,
      uni_doc_uri: `http://localhost:3100/uploads/${req.file.filename}`,
      uni_doc_id: req.file.filename,
      status: "UPLOADED",
      originalName: req.file.originalname,
    });
  });
});

// Add a new route to fetch evidence by uni_doc_id
InstitueRouter.get("/evidence/:uni_doc_id", async (req, res) => {
  const { uni_doc_id } = req.params;
  console.log("[InstituteEvidence] ========== START ==========");
  console.log("[InstituteEvidence] Received request for uni_doc_id:", uni_doc_id);
  console.log("[InstituteEvidence] Request method:", req.method);
  console.log("[InstituteEvidence] Request path:", req.path);
  const authHeader = req.headers.authorization || "";
  const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const tokenPresent = Boolean(rawToken);
  let decodedRole = "unknown";
  try {
    const decoded = rawToken ? jwt.decode(rawToken) : null;
    decodedRole = decoded?.role || decoded?.mode || decoded?.user?.role || decoded?.user?.mode || "unknown";
  } catch (decodeError) {
    console.warn("[InstituteEvidence] Token decode failed:", decodeError.message);
  }
  console.log("[InstituteEvidence] Token present:", tokenPresent);
  console.log("[InstituteEvidence] Decoded role:", decodedRole);

  try {
    if (!uni_doc_id) {
      console.error("[InstituteEvidence] uni_doc_id is missing from params");
      return res.status(400).json({ success: false, message: "Document ID is required" });
    }

    console.log("[InstituteEvidence] Querying database for uni_doc_id:", uni_doc_id);
    
    const document = await prisma.universityDocuments.findUnique({
      where: { uni_doc_id },
      select: {
        uni_doc_id: true,
        doc_id: true,
        uni_doc_uri: true,
        status: true,
        errors: true,
        extractedTexts: true,
        legalAnalysisJson: true,
        facultyAnalysisJson: true,
        researchEligibilityJson: true,
        publicationCredibilityJson: true,
      },
    });

    if (!document) {
      console.warn("[InstituteEvidence] Document NOT FOUND in database for uni_doc_id:", uni_doc_id);
      console.warn("[InstituteEvidence] Returning 404 status");
      console.log("[InstituteEvidence] Status code returned:", 404);
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    console.log("[InstituteEvidence] Document FOUND:");
    console.log("[InstituteEvidence] - uni_doc_id:", document.uni_doc_id);
    console.log("[InstituteEvidence] - doc_id:", document.doc_id);
    console.log("[InstituteEvidence] - status:", document.status);
    console.log("[InstituteEvidence] - has legalAnalysisJson:", !!document.legalAnalysisJson);
    console.log("[InstituteEvidence] - has facultyAnalysisJson:", !!document.facultyAnalysisJson);
    console.log("[InstituteEvidence] - has researchEligibilityJson:", !!document.researchEligibilityJson);
    console.log("[InstituteEvidence] Returning 200 status with data");
    console.log("[InstituteEvidence] ========== END ==========");

    console.log("[InstituteEvidence] Status code returned:", 200);
    res.status(200).json({
      success: true,
      message: "Evidence fetched successfully",
      data: document,
    });
  } catch (error) {
    console.error("[InstituteEvidence] ========== ERROR ==========");
    console.error("[InstituteEvidence] Error fetching evidence:", error);
    console.error("[InstituteEvidence] Error message:", error.message);
    console.error("[InstituteEvidence] Error stack:", error.stack);
    console.error("[InstituteEvidence] Returning 500 status");
    console.log("[InstituteEvidence] Status code returned:", 500);
    console.error("[InstituteEvidence] ========== END ==========");
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Mount subrouters
InstitueRouter.use("/auth", InstitueAuth);
InstitueRouter.use("/data", fakeAuth, InstitueData);
InstitueRouter.use("/nirf", fakeAuth, NirfRouter);

// Health check endpoint
InstitueRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Institute router is working" });
});

module.exports = InstitueRouter;
