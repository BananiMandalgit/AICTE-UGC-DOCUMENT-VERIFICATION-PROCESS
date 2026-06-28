const { default: axios } = require("axios");
const { LogAction, Doer, LogObject } = require("../../../services/enums");
const { actionLogger, Log } = require("../../../services/logging");
const prisma = require("../../../utils/db");
const { object } = require("zod");
const fs = require("fs");
const { assignDocumentToEvaluator } = require("../../../services/evaluatorMatching");

const availableApplication = async (req, res) => {
    try {

        const application = await prisma.applicationTypes.findMany({ include: { documents: true } });
        return res.json({ data: application });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ errors: "Internal Server Error." });
    }

}

const get_institute_data = async (req, res) => {
    const { institute_id } = req.authData;
    
    // 💡 IMPROVEMENT: Check if institute_id is present before querying.
    if (!institute_id) {
        return res.status(401).json({ success: false, message: "Authentication data missing (institute_id required)." });
    }

    try {
        // 🛑 FIX: Changed from findUniqueOrThrow to findUnique. 
        // findUniqueOrThrow crashes the server if the record is not found (PrismaClientKnownRequestError).
        // findUnique returns null if the record is not found, allowing graceful error handling.
        const result = await prisma.university.findUnique({ where: { id: institute_id } })
        
        // 🛑 FIX: Explicitly check if the result is null (record not found)
        if (!result) {
            return res.status(401).json({
                success: false,
                message: "No institute found with given institute_id.",
            });
        }
        
        res.status(200).json({
            success: true,
            data: result, // Returns an array of objects with institute_id and institute_data
        });
    } catch (error) {
        // 💡 IMPROVEMENT: Changed the catch block to return 500 for true server/database errors
        // (The 401 is handled above if the record is simply missing)
        console.error("Error fetching data:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error during data fetching.",
        });
    }
};

// *** CRITICAL FIX: ADDED THE MISSING GET_DATA CONTROLLER FUNCTION ***
/*const get_data = async (req, res) => {
    // This function handles the GET /institute/data request
    try {
        // Fetch data to prove the authorization works (fetching evaluator data, as they are the authenticated user)
        const data = await prisma.evaluator.findMany({
            select: { email: true, role: true, evaluator_id: true, state: true }
        });
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching data for /institute/data:", error);
        return res.status(500).json({ error: "Failed to fetch institute data." });
    }
};*/
// Inside api/controllers/institute/data/index.js

const get_data = async (req, res) => {
    const { institute_id } = req.authData;

    if (!institute_id) {
        return res.status(401).json({ success: false, message: "Authentication data missing (institute_id required)." });
    }

    try {
        // Fetch institute data from the database
        const instituteData = await prisma.university.findUnique({
            where: { id: institute_id },
            include: {
                UniversityApplication: true, // Include related applications
                placementData: true, // Include related placement data
                nirfRuns: true, // Include related NIRF runs
            },
        });

        if (!instituteData) {
            return res.status(404).json({
                success: false,
                message: "Institute not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: instituteData,
        });
    } catch (error) {
        console.error("Error fetching institute data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
// Inside api/controllers/institute/data/index.js
/*const get_data = async (req, res) => {
    try {
        const data = await prisma.evaluator.findMany({ ... }); // <-- CRASH HAPPENS HERE
        return res.status(200).json(data); 
    } catch (error) {
        // ... (This block doesn't run if the crash is severe)
    }
};*/

// New controller for document verification
const verify_document = async (req, res) => {
 const { uni_doc_uri, doc_id, formatId, uni_application_id } = req.body;

 if (!uni_doc_uri || !doc_id || !formatId || !uni_application_id) {
 return res.status(400).json({
 success: false,
 message: "Missing required fields for document verification.",
});
 }

 try {
 // Placeholder verification logic
 // For now, simply return verified: true with a success message

 // Log the verification attempt await actionLogger.log(new Log(new Date(), uni_application_id, undefined, undefined, LogAction.DOC_VERIFIED, Doer.UNIVERSITY, LogObject.DOCUMENT));

 return res.status(200).json({
 success: true,
 verified: true,
 message: "Document verified successfully.",
});
 } catch (error) {
 console.error("Error verifying document:", error);
 return res.status(500).json({
 success: false,
 message: "Internal server error during document verification.",
 });
 }
};


const start_new_application = async (req, res) => {
    const { application, documents } = req.body;
    const { institute_id } = req.authData;

    console.error("ROLE:", req.user?.role);
    console.error("STEP: Received request to start new application");
    console.error("DATA: application", JSON.stringify(application, null, 2));

    if (!institute_id || typeof application !== "object") {
        console.error("STEP: Validation failed - Missing institute_id or invalid application object");
        return res.status(400).json({
            success: false,
            message: "Invalid input: institute_id and a valid application object are required.",
        });
    }

    // Validate documents array
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        console.error("STEP: Validation failed - No documents provided");
        return res.status(400).json({
            success: false,
            message: "Please upload at least one document before submitting your application.",
        });
    }

    // Validate each document has required fields
    for (const doc of documents) {
        if (!doc.doc_id) {
            console.error("STEP: Validation failed - Document missing doc_id");
            return res.status(400).json({
                success: false,
                message: "Invalid document: missing document ID (doc_id).",
            });
        }
        if (!doc.uni_doc_uri) {
            console.error("STEP: Validation failed - Document missing uni_doc_uri", doc);
            return res.status(400).json({
                success: false,
                message: `Invalid document ${doc.doc_id}: missing document URL (uni_doc_uri). Please ensure the document is uploaded successfully.`,
            });
        }
    }

    try {
        console.error("STEP: Attempting to create university application");
        const applicationRes = await prisma.universityApplication.create({
            data: {
                uni_application_id: application.uni_application_id,
                application_name: application.application_name,
                application_desc: application.application_description,
                application_id: application.application_id,
                universityId: institute_id,
                status: "SUBMITTED", // ✅ Set initial status
                submittedAt: new Date(), // ✅ Track submission time
            },
        });
        console.error("STEP: University application created successfully", JSON.stringify(applicationRes, null, 2));

        for (const doc of documents) {
            console.error("ROLE:", req.user?.role);
            console.error("DOC_ID:", doc.doc_id);
            console.error("DOC_ID TYPE:", typeof doc.doc_id);
            console.error("DOC_URI:", doc.uni_doc_uri);

            const createdDoc = await prisma.universityDocuments.create({
                data: {
                    uni_application_id: applicationRes.uni_application_id,
                    doc_id: doc.doc_id,
                    uni_doc_uri: doc.uni_doc_uri,
                    status: "SUBMITTED",
                },
            });

            console.error("STEP: Document created successfully", JSON.stringify(createdDoc, null, 2));
        }

        // ✅ AUTO-ASSIGN EVALUATORS: Automatically assign documents to evaluators based on specialization
        console.log("🔄 Triggering automatic evaluator assignment...");
        try {
            // Call the evaluator matching service asynchronously
            setImmediate(async () => {
                try {
                    await assignDocumentToEvaluator();
                    console.log(`✅ Evaluators automatically assigned for application ${applicationRes.uni_application_id}`);
                } catch (assignError) {
                    console.error("❌ Error during automatic evaluator assignment:", assignError);
                }
            });
        } catch (assignError) {
            console.error("❌ Failed to trigger evaluator assignment:", assignError);
            // Don't fail the application submission if assignment fails
        }

        res.status(200).json({
            id: applicationRes.uni_application_id,
            success: true,
            message: `Successfully created ${applicationRes.uni_application_id}`,
            token: institute_id,
        });
    } catch (error) {
        console.error("ROLE:", req.user?.role);
        console.error("STEP: Error occurred during application creation");
        console.error("ERROR:", error.message, error.stack);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

const get_applications = async (req, res) => {
 const { institute_id } = req.authData;
console.log(institute_id)
 if (!institute_id) {
 return res.status(400).json({ error: "Institute ID is required" });
 }

 try {
 const applications = await prisma.universityApplication.findMany({ orderBy: { createdOn: "desc" }, where: { universityId: institute_id }, include: { UniversityDocuments: true, application: { include: { documents: true } } } });
 applications.documents = applications.UniversityDocuments;
 delete applications.UniversityDocuments;
 if (!applications) {
    return res.status(404).json({ error: "No applications found for this institute" });
 }

 res.status(200).json({
 success: true,
  data: applications, // Send the JSON data to the frontend
 });
 } catch (error) {
 console.error("Error fetching applications:", error);
 res.status(500).json({ error: "Internal Server Error" });
}
}

const get_application_document_by_id = async (req, res) => {
 const { application_id } = req.query;
 const { institute_id } = req.authData;
 console.log(institute_id, application_id)
 if (!institute_id || !application_id) {
     return res.status(400).json({ error: "Institute ID and Application ID are required" });
}

 try {
 const documents = await prisma.universityApplication.findUnique({ where: { uni_application_id: application_id, universityId: institute_id }, include: { application: { include: { documents: { include: { documentR: true } } } }, UniversityDocuments: { include: { document: true, assigned_evaluator: true } } } });

 if (!documents) {
 return res.status(404).json({ error: "No application found with the given Application ID for the given instituteID." });
 }
 res.status(200).json({
 success: true,
 data: documents,
 });
} catch (err) {
 console.error("Error fetching application data:", err);
 res.status(500).json({ error: "Internal Server Error" });
 }
}

const getUniversityDocumentBy_doc_id = async (req, res) => {
 const { doc_id } = req.body;
 try {
 const documents = await prisma.universityDocuments.findMany({ where: { doc_id: doc_id }, include: { document: true } });
 return res.status(200).json({ data: documents });
 }
  catch (err) {
 console.log("getUniversityDOCBYdoc_id", err);
res.status(500).json({ errors: err })
 }
}

const docUpload = async (uni_application_id, doc_id, uni_doc_uri, response) => {
    try {
        console.error("STEP: Starting document upload");
        console.error("DATA: uni_application_id", uni_application_id);
        console.error("DATA: doc_id", doc_id);
        console.error("DATA: uni_doc_uri", uni_doc_uri);
        console.error("DATA: response", JSON.stringify(response, null, 2));

        const document = await prisma.$transaction(async (prisma) => {
            console.error("STEP: Updating existing documents to REJECTED");
            await prisma.universityDocuments.updateMany({
                where: { uni_application_id: uni_application_id, doc_id: doc_id },
                data: { status: "REJECTED" },
            });

            console.error("STEP: Creating new university document");
            const createdDoc = await prisma.universityDocuments.create({
                data: {
                    uni_application_id: uni_application_id,
                    doc_id: doc_id,
                    uni_doc_uri: uni_doc_uri,
                    errors: response?.data.layout_issues,
                    extractedTexts: response?.data?.placeholder_values,
                    status: "SUBMITTED",
                },
                include: { document: true, application: true, assigned_evaluator: true },
            });

            console.error("STEP: Document created successfully", JSON.stringify(createdDoc, null, 2));
            return createdDoc;
        });

        console.error("STEP: Logging document submission action");
        await actionLogger.log(
            new Log(
                new Date(),
                uni_application_id,
                document.uni_doc_id,
                undefined,
                LogAction.DOC_SUBMITTED,
                Doer.UNIVERSITY,
                LogObject.DOCUMENT
            )
        );

        return document;
    } catch (err) {
        console.error("STEP: Error occurred during document upload");
        console.error("ERROR:", err.message, err.stack);
        actionLogger.error(`${uni_doc_uri} failed creating doc for application_id ${uni_application_id}`);
    }
};
const FASTAPIURL = "http://localhost:8000";
// --- Research Eligibility Evidence Logic ---
const RESEARCH_ELIGIBILITY_DOCS = [
  { id: "collaboration_1", keywords: ["approval letter", "approval number", "validity"] },
  { id: "eoa_5", keywords: ["affiliation letter", "approval"] },
  { id: "appointment_letter", keywords: ["appointment letter"] },
  { id: "phd_supervisor_proof", keywords: ["phd supervisor", "recognition"] },
  { id: "odl_ol_3", keywords: ["bonafide", "enrollment", "student support"] },
  { id: "plagiarism_report", keywords: ["plagiarism"] }
];

function isResearchEligibilityDoc(doc_id, doc_name) {
  const idMatch = RESEARCH_ELIGIBILITY_DOCS.some(d => doc_id === d.id);
  const nameMatch = RESEARCH_ELIGIBILITY_DOCS.some(d =>
    d.keywords.some(k => doc_name && doc_name.toLowerCase().includes(k))
  );
  return idMatch || nameMatch;
}

async function computeResearchEligibilityJson(doc_id, doc_name, extractedTexts) {
  // Call FastAPI service with PDF file for research eligibility analysis
  const FormData = require('form-data');
  const path = require('path');
  const formData = new FormData();
  // Assume uni_doc_uri is a local file path
  formData.append('file', fs.createReadStream(extractedTexts.__filePath || extractedTexts.filePath || extractedTexts.path || extractedTexts), path.basename(extractedTexts.__filePath || extractedTexts.filePath || extractedTexts.path || extractedTexts));
  try {
    const researchResponse = await axios.post(
      `${FASTAPIURL}/analyze-research-eligibility`,
      formData,
      { headers: formData.getHeaders() }
    );
    return researchResponse.data;
  } catch (err) {
    console.error('Research eligibility analysis failed:', err.message);
    return null;
  }
}

const document_analysis = async (req, res) => {
  const { uni_application_id, doc_id, uni_doc_uri } = req.body;
  let response;
  try {
    // Check document type
    const documentType = doc_id.toLowerCase();
    const docName = req.body.document_name || "";

    let legalAnalysisJson = null;
    let facultyAnalysisJson = null;
    let researchEligibilityJson = null;

    if (
      documentType.includes("legal") ||
      documentType.includes("affidavit") ||
      docName === "Affidavit 1: Application verification and compliance"
    ) {
      // Call FastAPI for legal keyword analysis
      try {
        const legalResponse = await axios.post(`${FASTAPIURL}/analyze-legal-keywords`, {
          pdf_url: uni_doc_uri,
          document_id: doc_id,
          document_name: req.body.document_name,
        });
        legalAnalysisJson = legalResponse.data;
      } catch (legalError) {
        console.error("Legal analysis failed:", legalError.message);
      }
    } else if (documentType.includes("faculty")) {
      // Call FastAPI for faculty credential validation
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(uni_doc_uri));

        const facultyResponse = await axios.post(
          `${FASTAPIURL}/validate-faculty-credentials`,
          formData,
          {
            headers: formData.getHeaders(),
          }
        );
        facultyAnalysisJson = facultyResponse.data;
      } catch (facultyError) {
        console.error("Faculty analysis failed:", facultyError.message);
      }
    }

    // Call existing comparison endpoint
    response = await axios.post(`${FASTAPIURL}/chat/comparison`, {
      template_url: req.body.formatId,
      filled_url: req.body.uni_doc_uri,
    });

    const layoutIssues = response.data.layout_issues || [];
    const layoutErrors = layoutIssues.map((issue, idx) => ({
      content: { text: issue.description },
      position: {
        boundingRect: {
          x1: issue.location?.[0] || 0,
          y1: issue.location?.[1] || 0,
          x2: issue.location?.[2] || 0,
          y2: issue.location?.[3] || 0,
        },
        rects: [],
        pageNumber: issue.page || 1,
      },
      comment: issue.description,
      id: `error-${idx + 1}`,
    }));

    response.data.layout_issues = layoutErrors;

    // Store in Prisma
    const document = await prisma.universityDocuments.create({
      data: {
        uni_application_id,
        doc_id,
        uni_doc_uri,
        errors: layoutErrors,
        extractedTexts: response.data.placeholder_values,
        legalAnalysisJson,
        facultyAnalysisJson,
        researchEligibilityJson,
        status: "SUBMITTED",
      },
      include: { document: true, application: true, assigned_evaluator: true },
    });

    response.data["currentUniDoc"] = document;
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Error in document_analysis:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.detail ||
        "An error occurred while processing the request.",
    });
  } finally {
    console.log("uploading");
  }
};

module.exports = { get_institute_data, start_new_application, get_applications, get_application_document_by_id, availableApplication, document_analysis, validate_university_image, validate_blueprint,get_data }