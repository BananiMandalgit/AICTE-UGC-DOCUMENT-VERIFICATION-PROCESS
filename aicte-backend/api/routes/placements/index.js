const express = require("express");
const multer = require("multer");
const {
  listPlacements,
  getPlacementReport,
  uploadPlacementData,
  scorePlacement,
  getInstitutePlacementSummary
} = require("../../controllers/placements/placement.controller");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!allowedMimeTypes.includes(file.mimetype) && !file.originalname.toLowerCase().endsWith(".xlsx")) {
      return cb(new Error("Only PDF and Excel files are allowed"));
    }
    return cb(null, true);
  },
  limits: { fileSize: 8 * 1024 * 1024 }
});

router.get("/", listPlacements);
router.get("/institute/:instituteId", getInstitutePlacementSummary);
router.get("/:collegeId", getPlacementReport);
router.post("/upload", upload.single("file"), uploadPlacementData);
router.post("/score", scorePlacement);

module.exports = router;
