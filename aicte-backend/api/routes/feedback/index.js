const express = require("express");
const { submitFeedback, listFeedback } = require("../../controllers/feedback");

const FeedbackRouter = express.Router();

FeedbackRouter.post("/", submitFeedback);
FeedbackRouter.get("/", listFeedback);

module.exports = FeedbackRouter;
