const prisma = require("../utils/db");

let unverifiedDocuments = [];
let allUnverifiedDocuments = [];
let ForgeryEvaluator = [];
let LayoutEvaluator = [];
let ContentEvaluator = [];
let allEvaluatorM = [ForgeryEvaluator, LayoutEvaluator, ContentEvaluator];
async function refetch() {
    let layer_index = 0;
    for (const layer of ["FORGERY_CHECKER", "LAYOUT_CHECKER", "CONTENT_CHECKER"]) {
        const data = await prisma.evaluator.findMany({ where: { role: layer }, include: { assigned_document: { where: { status: "ASSIGNED" } } } });
        allEvaluatorM[layer_index] = data.sort((a, b) => a.assigned_document.length - b.assigned_document.length);
        layer_index++;
    };
    const data = await prisma.universityDocuments.findMany({ where: { status: "SUBMITTED", }, include: { document: true, assigned_evaluator: true } });
    console.log("Started Evaluator Matcher.", data);
    unverifiedDocuments = data.sort((doc_a, doc_b) => doc_a.document.deadline.getTime() - doc_b.document.deadline.getTime());
    allUnverifiedDocuments = [new Array(...unverifiedDocuments), new Array(...unverifiedDocuments), new Array(...unverifiedDocuments)]
    return setTimeout(() => { console.log("All data fetched.") }, 1000);
};
refetch().then(() => {
    assignDocumentToEvaluator().then(() => { console.log("Successfully assigned Documents to Evaluators.") });
});
async function assignDocumentToEvaluator(allEvaluator = allEvaluatorM) {
    const assignmentsForRequest = [];
    await refetch();
    for (const doc of unverifiedDocuments) {
        const assigned = [];
        let layer_index = 0;
        for (const layer of ["FORGERY_CHECKER", "LAYOUT_CHECKER", "CONTENT_CHECKER"]) {
            let flag = false;
            allEvaluator[layer_index].forEach((eval) => {
                if (eval.specialization.includes(doc.doc_id)) {
                    assigned.push({ evaluator_id: eval.evaluator_id, uni_doc_id: doc.uni_doc_id, check_type: layer });
                    flag = true;
                }
            });
            if (!flag) {
                const index = Math.floor(Math.random() * allEvaluator[layer_index].length);
                const eval = allEvaluator[layer_index][index];
                assigned.push({ evaluator_id: eval.evaluator_id, uni_doc_id: doc.uni_doc_id, check_type: layer });
            }
            layer_index++;
        }
        await pushAssignedToDB(assigned);
        assignmentsForRequest.push(...assigned);
    }
    return assignmentsForRequest;
}


async function pushAssignedToDB(assigned) {
    console.log("assigned", assigned);
    try {
        await prisma.$transaction(async (prisma) => {
            // Track unique application IDs to update once per application
            const applicationIds = new Set();
            
            for (const assignment of assigned) {
                // Update document status to ASSIGNED
                const doc = await prisma.universityDocuments.update({ 
                    where: { uni_doc_id: assignment.uni_doc_id }, 
                    data: { status: "ASSIGNED" },
                    select: { uni_application_id: true }
                });
                
                // Create evaluator-document relation
                await prisma.evaluatorDocumentRelation.create({ 
                    data: { 
                        evaluator_id: assignment.evaluator_id, 
                        uni_doc_id: assignment.uni_doc_id, 
                        check_type: assignment.check_type, 
                        status: "ASSIGNED" 
                    } 
                });
                
                // Track application for status update
                applicationIds.add(doc.uni_application_id);
            }
            
            // ✅ FIX: Update application status to IN_REVIEW when evaluators are assigned
            for (const appId of applicationIds) {
                await prisma.universityApplication.update({
                    where: { uni_application_id: appId },
                    data: { status: "IN_REVIEW" }
                });
                console.log(`✅ Application ${appId} status updated to IN_REVIEW (evaluator assigned)`);
            }
        });
    }
    catch (error) {
        console.error("Error in pushAssignedToDB:", error);
    }
}

module.exports = { assignDocumentToEvaluator };