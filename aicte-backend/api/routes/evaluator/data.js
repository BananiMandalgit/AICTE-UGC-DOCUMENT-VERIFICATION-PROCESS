const { getAssignedDocuments, actionOnAssignedApplications, getEvaluatorData, actionOnAssignedDocuments } = require("../../controllers/evaluator/data/data.controller");

const evaluatorData = require("express").Router();
evaluatorData.get("/data", getEvaluatorData);
evaluatorData.get("/assigned_docs", getAssignedDocuments);
evaluatorData.post("/action_on_doc", actionOnAssignedDocuments);

// --- Evidence Report Route ---
const { getEvidenceReport } = require("../../controllers/evaluator/data/data.controller");
// Returns grouped AI analysis for one application
evaluatorData.get("/evidence-report/:uni_application_id", getEvidenceReport);

module.exports = { evaluatorData };