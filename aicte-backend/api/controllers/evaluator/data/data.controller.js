const { LogAction, Doer, LogObject } = require("../../../services/enums");
const { assignDocumentToEvaluator } = require("../../../services/evaluatorMatching");
const { actionLogger, Log } = require("../../../services/logging");
const prisma = require("../../../utils/db");

const allowedStatusActions = ['IN_REVIEW', 'APPROVED', 'REJECTED'];

const getEvaluatorData = async (req, res) => {
    const authData = req.authData;
    try {
        const evaluator = await prisma.evaluator.findUnique({
            where: { evaluator_id: authData.evaluator_id },
            select: {
                evaluator_id: true,
                email: true,
                role: true
            }
        });
        
        if (!evaluator) {
            return res.status(404).json({ error: "Evaluator not found" });
        }

        // ✅ IMPROVED: Filter by document assignments AND application status
        // Evaluators should only see applications that are SUBMITTED or later in the workflow
        const assignedRelations = await prisma.evaluatorDocumentRelation.findMany({
            where: { evaluator_id: authData.evaluator_id },
            include: {
                document: {
                    include: {
                        document: true,
                        application: {
                            include: {
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
                                UniversityDocuments: {
                                    include: {
                                        document: true,
                                        assigned_evaluator: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Transform data to match frontend expectations
        // Group documents by application
        const applicationsMap = new Map();
        
        // ✅ Filter: Only include applications with valid submission status
        const validStatuses = ['SUBMITTED', 'PROCESSING', 'IN_REVIEW', 'VERIFIED', 'APPROVED', 'REJECTED'];
        
        if (assignedRelations.length) {
            for (const relation of assignedRelations) {
                const uniDoc = relation.document;
                const application = uniDoc?.application;
                
                // Skip if no application or application status is not valid
                if (!application || !validStatuses.includes(application.status)) {
                    console.log(`Skipping application ${application?.uni_application_id || 'unknown'} with status ${application?.status || 'none'}`);
                    continue;
                }

                const appId = application.uni_application_id;
                if (!applicationsMap.has(appId)) {
                    const requirementDocs = (application.application?.documents || []).map((doc) => ({
                        doc_id: doc.doc_id,
                        document: doc.documentR || doc.document,
                        latestUpload: null
                    }));

                    applicationsMap.set(appId, {
                        uni_application_id: application.uni_application_id,
                        application_name: application.application_name,
                        application_desc: application.application_desc,
                        createdOn: application.createdOn,
                        university: application.university,
                        documents: requirementDocs,
                        UniversityDocuments: []
                    });
                }
            }

            const applicationIds = Array.from(applicationsMap.keys());
            const documentsByApp = await Promise.all(
                applicationIds.map((appId) =>
                    prisma.universityDocuments.findMany({
                        where: { uni_application_id: appId },
                        include: {
                            document: true,
                            assigned_evaluator: true,
                        },
                    })
                )
            );

            documentsByApp.forEach((docs, index) => {
                const appId = applicationIds[index];
                const appData = applicationsMap.get(appId);
                if (appData) {
                    appData.UniversityDocuments = docs;

                    if (Array.isArray(appData.documents)) {
                        appData.documents = appData.documents.map((requirement) => {
                            const latestDoc = docs
                                .filter((doc) => doc.doc_id === requirement.doc_id)
                                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
                            return {
                                ...requirement,
                                latestUpload: latestDoc,
                            };
                        });
                    }
                }
            });
        }

        // Convert map to array
        const applications = Array.from(applicationsMap.values()).sort(
            (a, b) => new Date(b.createdOn) - new Date(a.createdOn)
        );

        console.log(
            "Returning evaluator data with applications:",
            applications.map((app) => ({
                uni_application_id: app.uni_application_id,
                docs: app.UniversityDocuments?.length || 0,
            }))
        );
        res.json({ 
            evaluator: {
                evaluator_id: evaluator.evaluator_id,
                email: evaluator.email,
                role: evaluator.role,
                assigned_document: applications
            }
        });
    }
    catch (err) {
        console.error("Error in getEvaluatorData:", err);
        res.status(500).json({ error: "Failed to fetch evaluator data", details: err.message });
    }
}

const getAssignedDocuments = async (req, res) => {
    const authData = req.authData;
    if (!authData.role.includes("evaluator")) {
        res.status(401).json({ errors: "Not authorized as Evaluator." })
    }
    try {
        let assignedDocuments = await prisma.universityDocuments.findMany({ where: { evaluator_id: authData.evaluator_id } });
        console.log("assignedDocument", assignedDocuments);
        if (assignedDocuments.length == 0) {
            await assignDocumentToEvaluator([authData.evaluator_id]);
        }
        assignedDocuments = await prisma.universityDocuments.findMany({ where: { evaluator_id: authData.evaluator_id } });
        return res.status(200).json({ data: assignedDocuments });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ errors: "Internal Server Error. Try again after some time." });
    }
}

const getAssignedDocumentById = async (req, res) => {
    const { evaluator_id } = req.authData;
    const { uni_doc_id } = req.params;
    try {
        const uniDoc = await prisma.universityDocuments.findUniqueOrThrow({ where: { uni_doc_id: uni_doc_id }, include: { document: { include: { application_type: true } } } });
        actionLogger.log(new Log(new Date(), undefined, uni_doc_id, evaluator_id, LogAction.DOC_VIEWED, Doer.EVALUATOR, LogObject.DOCUMENT));
        return res.status(200).json({ data: uniDoc });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ errors: "Document not found." });
    }
}


const actionOnAssignedDocuments = async (req, res) => {
    const { uni_doc_id, messages, status } = req.body;
    const { evaluator_id } = req.authData;
    if (!allowedStatusActions.includes(status)) {
        return res.status(401).json({ errors: "You are not allowed to perform this actions." });
    }
    let data = {};
    if (status === "REJECTED" && !messages) {
        return res.status(400).json({ errors: "Please Provide reason for rejection." });
    }
    if (messages) {
        data = { messages: messages };
    }
    if (status) {
        data['status'] = status;
    }
    let updateDoc
    try {
        const response = await prisma.$transaction(async (prisma) => {
            // Update evaluator-document relation
            updateDoc = await prisma.evaluatorDocumentRelation.updateMany({ 
                where: { evaluator_id: evaluator_id, uni_doc_id: uni_doc_id }, 
                data: { status: status } 
            });
            
            // Update document with messages
            const doc = await prisma.universityDocuments.update({ 
                where: { uni_doc_id }, 
                data: { 
                    messages: [{ 
                        message: { 
                            id: Math.random().toString(36), 
                            content: messages, 
                            timestamp: new Date().toString() 
                        } 
                    }],
                    status: status // ✅ Also update document status
                },
                select: { uni_application_id: true }
            });
            
            // ✅ FIX: Check if all documents for this application are approved/rejected
            const allDocs = await prisma.universityDocuments.findMany({
                where: { uni_application_id: doc.uni_application_id },
                select: { status: true }
            });
            
            const allApproved = allDocs.every(d => d.status === 'APPROVED');
            const anyRejected = allDocs.some(d => d.status === 'REJECTED');
            
            // Update application status based on document statuses
            if (allApproved) {
                await prisma.universityApplication.update({
                    where: { uni_application_id: doc.uni_application_id },
                    data: { status: 'APPROVED' }
                });
                console.log(`✅ Application ${doc.uni_application_id} status updated to APPROVED`);
            } else if (anyRejected) {
                await prisma.universityApplication.update({
                    where: { uni_application_id: doc.uni_application_id },
                    data: { status: 'REJECTED' }
                });
                console.log(`✅ Application ${doc.uni_application_id} status updated to REJECTED`);
            }
            
            return doc;
        })
        actionLogger.log(new Log(new Date(), undefined, uni_doc_id, evaluator_id, status, Doer.EVALUATOR, LogObject.DOCUMENT));
        return res.status(200).json({ data: updateDoc, message: "Document Updated Successfully." })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ errors: "Failed To update the document" });
    }
}

const actionOnAssignedApplications = async (req, res) => {
    //TODO if time left then implement
}

module.exports = { actionOnAssignedApplications, actionOnAssignedDocuments, getAssignedDocuments, getEvaluatorData }
// --- Evidence Report Handler ---
// GET /api/evaluator/evidence-report/:uni_application_id
async function getEvidenceReport(req, res) {
    const { uni_application_id } = req.params;
    const prisma = require("../../../utils/db");
    try {
        console.log(`[EvidenceReport] application id received: ${uni_application_id}`);
        // 1. Find application
        const application = await prisma.universityApplication.findUnique({
            where: { uni_application_id },
            select: {
                uni_application_id: true,
                application_id: true,
                application_name: true,
                application_desc: true,
                createdOn: true,
                status: true,
                universityId: true,
                university: {
                    select: {
                        id: true,
                        universityName: true,
                        state: true,
                        district: true,
                    },
                },
            },
        });
        if (!application) {
            return res.status(404).json({ success: false, error: "Application not found" });
        }
        console.log(`[EvidenceReport] application found: ${application.uni_application_id}`);

        // 2. Fetch all UniversityDocuments for this application
        const documents = await prisma.universityDocuments.findMany({
            where: { uni_application_id },
            select: {
                uni_doc_id: true,
                doc_id: true,
                legalAnalysisJson: true,
                facultyAnalysisJson: true,
                researchEligibilityJson: true,
                publicationCredibilityJson: true,
                timestamp: true,
            },
            orderBy: { timestamp: "desc" },
        });
        console.log(`[EvidenceReport] documents count: ${documents.length}`);

        // Filter docs that have at least one analysis JSON
        const evidenceDocs = documents.filter((doc) =>
            doc.legalAnalysisJson ||
            doc.facultyAnalysisJson ||
            doc.researchEligibilityJson ||
            doc.publicationCredibilityJson
        );

        // 3. Faculty Score Validation (collect all existing blocks)
        const facultyScoreValidation = evidenceDocs
            .filter((doc) => doc.facultyAnalysisJson)
            .map((doc) => doc.facultyAnalysisJson);

        // 4. Research Eligibility Evidence (collect all existing blocks)
        const researchEligibilityEvidence = evidenceDocs
            .filter((doc) => doc.researchEligibilityJson)
            .map((doc) => doc.researchEligibilityJson);

        // 5. Publication Credibility Evidence (collect all existing blocks)
        const publicationCredibilityEvidence = evidenceDocs
            .filter((doc) => doc.publicationCredibilityJson)
            .map((doc) => doc.publicationCredibilityJson);

        // 6. Placement Intelligence (latest PlacementData for this university)
        let placementIntelligence = {};
        const placement = await prisma.placementData.findFirst({
            where: { instituteId: application.universityId },
            orderBy: { academicYear: "desc" },
            select: {
                aiScore: true,
                riskLevel: true,
                analysisJson: true,
                academicYear: true,
                studentsPlaced: true,
                eligibleStudents: true,
                placementPercent: true,
                avgSalaryLpa: true,
                corePlacementPercent: true,
                industryMoUs: true,
                internshipsCount: true,
                higherEducationPercent: true,
                complianceRemarks: true,
            },
        });
        if (placement) {
            placementIntelligence = placement.analysisJson || {
                aiScore: placement.aiScore,
                riskLevel: placement.riskLevel,
                academicYear: placement.academicYear,
                studentsPlaced: placement.studentsPlaced,
                eligibleStudents: placement.eligibleStudents,
                placementPercent: placement.placementPercent,
                avgSalaryLpa: placement.avgSalaryLpa,
                corePlacementPercent: placement.corePlacementPercent,
                industryMoUs: placement.industryMoUs,
                internshipsCount: placement.internshipsCount,
                higherEducationPercent: placement.higherEducationPercent,
                complianceRemarks: placement.complianceRemarks,
            };
        }

        // 7. NIRF Scoring (latest NirfRun for this university)
        let nirfScoring = {};
        const nirfRun = await prisma.nirfRun.findFirst({
            where: { instituteId: application.universityId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                createdAt: true,
                finalScore: true,
                academicYear: true,
                components: {
                    select: {
                        id: true,
                        key: true,
                        label: true,
                        score: true,
                    },
                },
            },
        });
        if (nirfRun) {
            nirfScoring = {
                id: nirfRun.id,
                createdAt: nirfRun.createdAt,
                academicYear: nirfRun.academicYear,
                finalScore: nirfRun.finalScore,
                components: nirfRun.components,
            };
        }

        // 8. Log which categories were filled
        const filled = [];
        if (facultyScoreValidation.length) filled.push("facultyScoreValidation");
        if (researchEligibilityEvidence.length) filled.push("researchEligibilityEvidence");
        if (publicationCredibilityEvidence.length) filled.push("publicationCredibilityEvidence");
        if (Object.keys(placementIntelligence).length) filled.push("placementIntelligence");
        if (Object.keys(nirfScoring).length) filled.push("nirfScoring");
        console.log(`[EvidenceReport] evidence sections populated: ${filled.join(", ")}`);

        // 9. Compose grouped response
        return res.json({
            applicationInfo: application,
            facultyScoreValidation,
            researchEligibilityEvidence,
            publicationCredibilityEvidence,
            placementIntelligence,
            nirfScoring,
        });
    } catch (err) {
        console.error("Error in getEvidenceReport", err);
        return res.status(500).json({ success: false, error: "Internal server error", details: err.message });
    }
}

module.exports.getEvidenceReport = getEvidenceReport;