const express = require("express");
const prisma = require("../../utils/db");
const { assignDocumentToEvaluator } = require("../../services/evaluatorMatching");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined.");
}

const InstitueData = express.Router();

// Debug middleware
InstitueData.use((req, res, next) => {
  console.log(`[DataRouter] ${req.method} ${req.path}`);
  next();
});

// Extract instituteId from Authorization header when available
InstitueData.use((req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.sub) {
        req.instituteId = payload.sub;
      }
    } catch (err) {
      console.warn("[DataRouter] Invalid JWT provided", err?.message || err);
    }
  }
  next();
});

// GET /data/applications - list applications for authenticated institute
InstitueData.get("/applications", async (req, res) => {
  try {
    const instituteId = req.instituteId || req.query.institute_id || req.query.id;
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: "Institute ID is required. Please login again.",
      });
    }

    const applications = await prisma.universityApplication.findMany({
      where: { universityId: instituteId },
      include: {
        UniversityDocuments: true,
        application: { include: { documents: true } },
      },
      orderBy: { createdOn: "desc" },
    });

    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("[DataRouter] Failed to fetch applications", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
});

// POST /data/new_application - Create a new application
InstitueData.post("/new_application", async (req, res) => {
  try {
    const { application, institute_id, documents } = req.body;
    
    console.log("[NewApplication] ========== NEW APPLICATION REQUEST ==========");
    console.log("[NewApplication] Received request body:", JSON.stringify({
      application,
      institute_id,
      documents: documents?.length || 0
    }, null, 2));
    
    if (!application || !institute_id) {
      return res.status(400).json({
        success: false,
        message: "Application and institute_id are required"
      });
    }

    console.log("[NewApplication] institute_id:", institute_id);
    const institute = await prisma.university.findUnique({ where: { id: institute_id } });
    if (!institute) {
      console.warn("[NewApplication] Institute not found for id:", institute_id);
      return res.status(404).json({
        success: false,
        message: "Institute not found. Please login again and retry.",
      });
    }

    // Validate application_id exists in ApplicationTypes table
    const appTypeExists = await prisma.applicationTypes.findUnique({
      where: { application_id: application.application_id }
    });

    if (!appTypeExists) {
      console.error("[NewApplication] Invalid application_id:", application.application_id);
      return res.status(400).json({
        success: false,
        message: `Invalid application type: "${application.application_id}". This application type is not registered in the system.`,
        hint: "If using UGC application types, ensure the database has been seeded with 'npm run seed'.",
      });
    }

    // Create or update the application in database
    // UPSERT supports EDIT MODE: reuses existing application when frontend passes existing uni_application_id
    // UGC COMPLIANCE: Only updates safe metadata (name, description) - NEVER modifies approval workflow fields
    const createdApp = await prisma.universityApplication.upsert({
      where: { uni_application_id: application.uni_application_id },
      update: {
        // SAFE FIELDS ONLY: Update metadata without affecting approval workflow
        application_name: application.application_name,
        application_desc: application.application_description,
      },
      create: {
        // CREATE MODE: New application starts with NOT_SUBMITTED status
        uni_application_id: application.uni_application_id,
        application_name: application.application_name,
        application_desc: application.application_description,
        application_id: application.application_id,
        universityId: institute_id,
        status: "NOT_SUBMITTED"
      },
      include: {
        UniversityDocuments: true,
        application: { include: { documents: true } }
      }
    });

    console.log(`Upserted application: ${createdApp.uni_application_id} (CREATE/EDIT mode)`);

    // Persist any documents that were uploaded as part of this workspace submission
    const createdDocuments = [];
    if (Array.isArray(documents) && documents.length) {
      console.log(`[NewApplication] Processing ${documents.length} documents...`);
      
      const statusMap = {
        ready: "SUBMITTED",
        processing: "PROCESSING",
        uploading: "NOT_SUBMITTED",
        uploaded: "SUBMITTED",
        up_loaded: "SUBMITTED",
        error: "REJECTED",
        failed: "REJECTED",
      };
      for (const doc of documents) {
        if (!doc || !doc.doc_id || !doc.uni_doc_uri) {
          console.warn("[NewApplication] Skipping invalid document:", doc);
          continue;
        }

        console.log(`[NewApplication] Processing document: ${doc.doc_id}, status: ${doc.status}, uri: ${doc.uni_doc_uri}`);

        try {
          const incomingStatus =
            typeof doc.status === "string"
              ? doc.status.trim().toLowerCase()
              : undefined;
          const createdDoc = await prisma.universityDocuments.create({
            data: {
              uni_application_id: createdApp.uni_application_id,
              doc_id: doc.doc_id,
              uni_doc_uri: doc.uni_doc_uri,
              status: statusMap[incomingStatus || ""] || "SUBMITTED",
              errors: doc.analysis?.layout_issues,
              extractedTexts: doc.analysis?.placeholder_values,
              messages: doc.analysis
                ? [
                    {
                      type: "analysis",
                      summary: {
                        format_match_percentage:
                          doc.analysis.format_match_percentage,
                        layout_match_score: doc.analysis.layout_match_score,
                        keyword_phrase_match: doc.analysis.keyword_phrase_match,
                        issue_summary: doc.analysis.issue_summary,
                        layouts_similar: doc.analysis.layouts_similar,
                      },
                      analysis: doc.analysis,
                    },
                  ]
                : undefined,
            },
            include: {
              document: true,
            },
          });

          createdDocuments.push(createdDoc);
          console.log(`[NewApplication] ✅ Created document: ${createdDoc.uni_doc_id}`);
        } catch (docError) {
          console.error(
            `Failed to persist document ${doc.doc_id} for application ${createdApp.uni_application_id}`,
            docError
          );
          // Added fix: Return a 500 error if document creation fails
          return res.status(500).json({
            success: false,
            message: `Failed to persist document ${doc.doc_id}`,
            error: docError.message,
          });
        }
      }
    } else {
      console.warn("[NewApplication] No documents array provided or empty");
    }

    console.log(`[NewApplication] Total documents created: ${createdDocuments.length}`);

    // ✅ FIX: Update application status to SUBMITTED if documents were uploaded
    let updatedApp = createdApp;
    if (createdDocuments.length > 0) {
      console.log(`[NewApplication] Updating application status to SUBMITTED...`);
      updatedApp = await prisma.universityApplication.update({
        where: { uni_application_id: createdApp.uni_application_id },
        data: { 
          status: "SUBMITTED",
          submittedAt: new Date(), // ✅ Track submission timestamp
        },
        include: {
          UniversityDocuments: true,
          application: { include: { documents: true } }
        }
      });
      console.log(`✅ Application ${updatedApp.uni_application_id} status updated to SUBMITTED`);
    }

    // Trigger evaluator assignment after application creation
    let assignments = [];
    if (createdDocuments.length) {
      try {
        assignments = await assignDocumentToEvaluator();
      } catch (assignError) {
        console.error("Evaluator assignment failed:", assignError);
      }
    }
    if (assignments && assignments.length) {
      console.log(`Assigned evaluator: ${assignments[0].evaluator_id}`);
    } else if (createdDocuments.length) {
      console.log("Assigned evaluator: pending (assignment skipped or failed)");
    }

    res.status(200).json({
      success: true,
      message: "Application created successfully",
      id: updatedApp.uni_application_id,
      application: updatedApp,
      documents: createdDocuments
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message
    });
  }
});

// GET /data/get_applications - Get all applications for an institute
InstitueData.get("/get_applications", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Institute ID is required"
      });
    }

    const applications = await prisma.universityApplication.findMany({
      where: { universityId: id },
      include: {
        UniversityDocuments: {
          include: {
            document: true,
            assigned_evaluator: {
              include: { evaluator: true }
            }
          }
        },
        application: { include: { documents: true } },
        Evaluator: true
      },
      orderBy: { createdOn: "desc" }
    });

    const transformedApplications = applications.map((app) => ({
      ...app,
      UniversityDocuments: app.UniversityDocuments.map((doc) => {
        const latestDecision = doc.assigned_evaluator?.length
          ? doc.assigned_evaluator[doc.assigned_evaluator.length - 1]
          : null;

        const { assigned_evaluator, ...rest } = doc;
        return {
          ...rest,
          evaluatorDecision: latestDecision
            ? {
                evaluator_id: latestDecision.evaluator_id,
                evaluator_email: latestDecision.evaluator?.email,
                evaluator_phone: latestDecision.evaluator?.phone,
                status: latestDecision.status,
                check_type: latestDecision.check_type,
              }
            : null,
        };
      })
    }));

    res.status(200).json({
      success: true,
      applications: transformedApplications
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message
    });
  }
});

// GET /data/get_documents - Get documents for an application
InstitueData.get("/get_documents", async (req, res) => {
  try {
    const { application_id } = req.query;

    if (!application_id) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required"
      });
    }

    const application = await prisma.universityApplication.findUnique({
      where: { uni_application_id: application_id },
      include: {
        UniversityDocuments: {
          include: { 
            document: true,
            assigned_evaluator: {
              include: {
                evaluator: true
              }
            }
          }
        },
        application: {
          include: {
            documents: {
              include: {
                documentR: true
              }
            }
          }
        },
        university: true,
        Evaluator: true
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Transform UniversityDocuments to include evaluator decision
    const transformedApplication = {
      ...application,
      UniversityDocuments: application.UniversityDocuments.map(doc => {
        // Get the latest evaluator decision (last one in the array)
        const latestDecision = doc.assigned_evaluator && doc.assigned_evaluator.length > 0
          ? doc.assigned_evaluator[doc.assigned_evaluator.length - 1]
          : null;

        console.log(`Document ${doc.uni_doc_id}: assigned_evaluator count = ${doc.assigned_evaluator?.length || 0}, latestDecision = `, latestDecision);

        return {
          ...doc,
          evaluatorDecision: latestDecision
            ? {
                evaluator_id: latestDecision.evaluator_id,
                evaluator_email: latestDecision.evaluator.email,
                evaluator_phone: latestDecision.evaluator.phone,
                status: latestDecision.status,
                check_type: latestDecision.check_type,
              }
            : null,
          assigned_evaluator: undefined
        };
      })
    };

    res.status(200).json({
      success: true,
      data: transformedApplication
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message
    });
  }
});

// POST /data - Get institute data
InstitueData.post("/", async (req, res) => {
  try {
    const { institute_id } = req.body;

    if (!institute_id) {
      return res.status(400).json({
        success: false,
        message: "Institute ID is required"
      });
    }

    const institute = await prisma.university.findUnique({
      where: { id: institute_id },
      include: {
        UniversityApplication: {
          include: {
            application: true,
            UniversityDocuments: true
          }
        }
      }
    });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    res.status(200).json({
      success: true,
      institute: institute,
      data: institute
    });
  } catch (error) {
    console.error("Error fetching institute:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch institute data",
      error: error.message
    });
  }
});

// POST /data/analysis/compare - Proxy AI comparison to FastAPI
InstitueData.post("/analysis/compare", async (req, res) => {
  const { template_url, filled_url } = req.body || {};

  if (!template_url || !filled_url) {
    return res.status(400).json({
      success: false,
      message: "template_url and filled_url are required",
    });
  }

  try {
    const response = await axios.post(`${FASTAPI_URL}/chat/comparison`, {
      template_url,
      filled_url,
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("AI comparison proxy error:", error?.message || error);
    return res.status(error?.response?.status || 502).json({
      success: false,
      message:
        error?.response?.data?.detail ||
        "AI comparison service unavailable. Please start the AI services.",
    });
  }
});

// POST /data/analysis/legal - Proxy legal keyword analysis to FastAPI
InstitueData.post("/analysis/legal", async (req, res) => {
  const { pdf_url, document_id, document_name } = req.body || {};

  if (!pdf_url || !document_id) {
    return res.status(400).json({
      success: false,
      message: "pdf_url and document_id are required",
    });
  }

  try {
    const payload = new URLSearchParams();
    payload.append("pdf_url", pdf_url);
    payload.append("document_id", document_id);
    payload.append("document_name", document_name || "Document");

    const response = await axios.post(
      `${FASTAPI_URL}/analyze-legal-keywords`,
      payload.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Legal analysis proxy error:", error?.message || error);
    return res.status(error?.response?.status || 502).json({
      success: false,
      message:
        error?.response?.data?.detail ||
        "Legal analysis service unavailable. Please start the AI services.",
    });
  }
});

module.exports = { InstitueData };
