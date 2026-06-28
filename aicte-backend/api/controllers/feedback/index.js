const prisma = require("../../utils/db");

const allowedRoles = new Set(["INSTITUTE", "EVALUATOR"]);

const normalizeRating = (rating) => {
  if (rating === undefined || rating === null) {
    return null;
  }
  const numeric = Number(rating);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(1, Math.min(5, Math.round(numeric)));
};

const submitFeedback = async (req, res) => {
  const { role, subject, message, contactName, contactEmail, contactPhone, rating } = req.body;

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: "Invalid role supplied." });
  }

  if (!subject || !message || !contactName || !contactEmail) {
    return res.status(400).json({
      success: false,
      message: "Subject, message, contact name and contact email are required.",
    });
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        role,
        subject: subject.trim(),
        message: message.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone ? String(contactPhone).trim() : null,
        rating: normalizeRating(rating),
      },
    });

    return res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error("Failed to save feedback", error);
    return res.status(500).json({ success: false, message: "Unable to submit feedback right now." });
  }
};

const listFeedback = async (_req, res) => {
  try {
    const entries = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: entries });
  } catch (error) {
    console.error("Failed to fetch feedback list", error);
    return res.status(500).json({ success: false, message: "Unable to fetch feedback." });
  }
};

module.exports = { submitFeedback, listFeedback };
