// 
// C:\Users\sudee\Downloads\halabarsa1\halabarsa1\aicte-backend\api\routes\evaluator\index.js

const { evaluatorAuth } = require("./auth");
const { evaluatorData } = require("./data");
const { getEvidenceReport } = require("../../controllers/evaluator/data/data.controller");
const { authJWT } = require("../../middlewares/auth");
const evaluatorRouter = require("express").Router();

// This line defines the /auth and /data prefixes for the evaluator module
evaluatorRouter.use("/auth", evaluatorAuth);
// Invoke authJWT so it actually returns the middleware function.
// No explicit role required here; we just validate the token.
evaluatorRouter.use("/data", authJWT(), evaluatorData);
// Direct route to match frontend path /api/evaluator/evidence-report/:uni_application_id
evaluatorRouter.get("/evidence-report/:uni_application_id", authJWT(), getEvidenceReport);

module.exports = { evaluatorRouter };