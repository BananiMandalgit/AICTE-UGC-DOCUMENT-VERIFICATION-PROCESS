const prisma = require("../api/utils/db");
const { applicationTypes, evaluatorRegisterForSeeder } = require("./data");
const { placementRecords } = require("./placementSampleData");
const { calculatePlacementScore } = require("../api/services/aiScoring/placementScoring");
console.log(typeof applicationTypes);
// ============================================================================
// EVALUATOR TEST CREDENTIALS
// ============================================================================
// All evaluators use the same password for easy testing: "Test@123"
// Login using either email OR phone number
// ============================================================================
// const evaluatorData = [
//     {
//         evaluator_id: "8c6b3a5a-5e2a-4f55-9f6a-6b5e9f7d9a01",
//         email: "admin@example.edu",
//         phone: "9000000000",
//         password: "admin123",
//         state: "Maharashtra",
//         district: "Mumbai",
//         pincode: "400001",
//         role: "FORGERY_CHECKER",
//         specialization: ["new_institute_0", "eoa_1"]
//     },
//     {
//         evaluator_id: "b7d5a3f8-8d9c-46f7-bf1b-f40b440f5f6e",
//         email: "johndoe@example.com",
//         phone: "9876543210",
//         password: "Test@123",  // Plain text password for testing
//         state: "Maharashtra",
//         district: "Mumbai",
//         pincode: "400001",
//         role: "FORGERY_CHECKER",
//         specialization: ["new_institute_0", "new_institute_1", "eoa_1", "eoa_3"]
//     },
//     {
//         evaluator_id: "f9b240d4-2121-4c69-9357-5089d7cb3a19",
//         email: "janedoe@example.com",
//         phone: "9123456789",
//         password: "Test@123",
//         state: "Karnataka",
//         district: "Bangalore",
//         pincode: "560001",
//         role: "LAYOUT_CHECKER",
//         specialization: ["collaboration_0", "collaboration_1", "collaboration_2"]
//     },
//     {
//         evaluator_id: "cbf66062-e8fc-4e5b-b467-b6f3ed3b3a2f",
//         email: "peterparker@example.com",
//         phone: "9122334455",
//         password: "Test@123",
//         state: "Delhi",
//         district: "New Delhi",
//         pincode: "110001",
//         role: "CONTENT_CHECKER",
//         specialization: ["odl_ol_0", "odl_ol_1", "odl_ol_2"]
//     },
//     {
//         evaluator_id: "aee9ec07-2f9e-4b9d-a0b3-0a79941a0b56",
//         email: "maryjane@example.com",
//         phone: "9233445566",
//         password: "Test@12",
//         state: "Tamil Nadu",
//         district: "Chennai",
//         pincode: "600001",
//         role: "FORGERY_CHECKER",
//         specialization: ["penal_actions_0", "penal_actions_1"]
//     },
//     {
//         evaluator_id: "d98b5bba-6ea0-4b2f-b0b5-0db37c6c5b92",
//         email: "brucewayne@example.com",
//         phone: "9344556677",
//         password: "Test@123",
//         state: "Gujarat",
//         district: "Ahmedabad",
//         pincode: "380001",
//         role: "LAYOUT_CHECKER",
//         specialization: ["hibernation_0", "hibernation_2"]
//     },
//     {
//         evaluator_id: "e93c4f9b-3456-4e87-bc68-c9d6adf12345",
//         email: "clarkkent@example.com",
//         phone: "9876654321",
//         password: "Test@123",
//         state: "Punjab",
//         district: "Ludhiana",
//         pincode: "141001",
//         role: "CONTENT_CHECKER",
//         specialization: ["odl_ol_0", "odl_ol_1", "odl_ol_2"]
//     },
//     {
//         evaluator_id: "f21d8abc-9abc-4e7d-a12f-bd34cd12e678",
//         email: "tonystark@example.com",
//         phone: "9001234567",
//         password: "Test@123",
//         state: "Haryana",
//         district: "Gurgaon",
//         pincode: "122001",
//         role: "LAYOUT_CHECKER",
//         specialization: ["collaboration_0", "collaboration_1", "collaboration_2"]
//     },
//     {
//         evaluator_id: "g87a6f5d-8d6e-4f7d-bc9e-bf12cd345678",
//         email: "dianaprince@example.com",
//         phone: "9551234567",
//         password: "Test@123",
//         state: "West Bengal",
//         district: "Kolkata",
//         pincode: "700001",
//         role: "FORGERY_CHECKER",
//         specialization: ["new_institute_0", "new_institute_1", "eoa_1", "eoa_3"]
//     }
// ];

const evaluatorData = [
    {
        evaluator_id: "8c6b3a5a-5e2a-4f55-9f6a-6b5e9f7d9a01",
        email: "admin@example.edu",
        phone: "9000000000",
        password: "admin123",
        state: "Maharashtra",
        district: "Mumbai",
        pincode: "400001",
        role: "FORGERY_CHECKER",
        specialization: ["new_institute_0", "eoa_1"]
    },
    {
        evaluator_id: "b7d5a3f8-8d9c-46f7-bf1b-f40b440f5f6e",
        email: "johndoe@example.com",
        phone: "9876543210",
        password: "Test@123",  // Plain text password for testing
        state: "Maharashtra",
        district: "Mumbai",
        pincode: "400001",
        role: "FORGERY_CHECKER",
        specialization: ["new_institute_0", "new_institute_1", "eoa_1", "eoa_3"]
    },
    {
        evaluator_id: "f9b240d4-2121-4c69-9357-5089d7cb3a19",
        email: "janedoe@example.com",
        phone: "9123456789",
        password: "Test@123",
        state: "Karnataka",
        district: "Bangalore",
        pincode: "560001",
        role: "LAYOUT_CHECKER",
        specialization: ["collaboration_0", "collaboration_1", "collaboration_2"]
    },
    {
        evaluator_id: "cbf66062-e8fc-4e5b-b467-b6f3ed3b3a2f",
        email: "peterparker@example.com",
        phone: "9122334455",
        password: "Test@123",
        state: "Delhi",
        district: "New Delhi",
        pincode: "110001",
        role: "CONTENT_CHECKER",
        specialization: ["odl_ol_0", "odl_ol_1", "odl_ol_2"]
    },
    {
        evaluator_id: "aee9ec07-2f9e-4b9d-a0b3-0a79941a0b56",
        email: "maryjane@example.com",
        phone: "9233445566",
        password: "Test@12",
        state: "Tamil Nadu",
        district: "Chennai",
        pincode: "600001",
        role: "FORGERY_CHECKER",
        specialization: ["penal_actions_0", "penal_actions_1"]
    },
    {
        evaluator_id: "d98b5bba-6ea0-4b2f-b0b5-0db37c6c5b92",
        email: "brucewayne@example.com",
        phone: "9344556677",
        password: "Test@123",
        state: "Gujarat",
        district: "Ahmedabad",
        pincode: "380001",
        role: "LAYOUT_CHECKER",
        specialization: ["hibernation_0", "hibernation_2"]
    },
    {
        evaluator_id: "e93c4f9b-3456-4e87-bc68-c9d6adf12345",
        email: "clarkkent@example.com",
        phone: "9876654321",
        password: "Test@123",
        state: "Punjab",
        district: "Ludhiana",
        pincode: "141001",
        role: "CONTENT_CHECKER",
        specialization: ["odl_ol_0", "odl_ol_1", "odl_ol_2"]
    },
    {
        evaluator_id: "f21d8abc-9abc-4e7d-a12f-bd34cd12e678",
        email: "tonystark@example.com",
        phone: "9001234567",
        password: "Test@123",
        state: "Haryana",
        district: "Gurgaon",
        pincode: "122001",
        role: "LAYOUT_CHECKER",
        specialization: ["collaboration_0", "collaboration_1", "collaboration_2"]
    },
    {
        evaluator_id: "g87a6f5d-8d6e-4f7d-bc9e-bf12cd345678",
        email: "dianaprince@example.com",
        phone: "9551234567",
        password: "Test@123",
        state: "West Bengal",
        district: "Kolkata",
        pincode: "700001",
        role: "FORGERY_CHECKER",
        specialization: ["new_institute_0", "new_institute_1", "eoa_1", "eoa_3"]
    }
];

async function seed() {
    await prisma.evaluatorDocumentRelation.deleteMany({});
    await prisma.universityApplication.deleteMany({});
    await prisma.universityDocuments.deleteMany({});
    await prisma.applicationDocuments.deleteMany({});
    await prisma.contactDetails.deleteMany({});
    await prisma.nirfComponentScore.deleteMany({});
    await prisma.nirfRun.deleteMany({});
    await prisma.university.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.applicationTypes.deleteMany({});
    await prisma.evaluator.deleteMany({});
    await prisma.placementData.deleteMany({});
    
    // Create test university
    const testUniversity = await prisma.university.create({
      data: {
        email: "testinstitute@example.edu",
        phone: "9876543210",
        password: "$argon2id$v=19$m=65536,t=3,p=4$uHbMlBfZtt90cBURWHU5eg$yWRUT/4xE7LrrRPTHK+fKvpoYIYm05c9oCK63nSfmUQ",  // Password: Test@123
        universityName: "Test Institute",
        universityType: "Autonomous",
        state: "Maharashtra",
        district: "Mumbai",
        pincode: 400001
      }
    });
    
    console.log("Test university created with ID:", testUniversity.id);
    
    const appTypes = applicationTypes; // Convert object to array

    for (const application of appTypes) {
        // Create ApplicationTypes record
        console.log(application)
        const appType = await prisma.applicationTypes.create({
            data: {
                application_id: application.application_id,
                application_name: application.application_name,
                application_description: application.application_description,
            }
        });

        // Create documents and link them to ApplicationTypes
        for (const doc of application.documents) {
            let role;
            let category;
            if (application.application_id.startsWith("ugc")) {
                role = "UGC";
                category = doc.category || "General";
            } else {
                role = "AICTE";
                category = "Affiliation";
            }
            const document = await prisma.document.create({
                data: {
                    doc_id: doc.doc_id,
                    doc_name: doc.doc_name,
                    format_uri: doc.format_uri,
                    deadline: new Date("2025-01-01T00:00:00.000Z"),
                    role,
                    category
                }
            });

            // Link the document to the application type
            await prisma.applicationDocuments.create({
                data: {
                    application_id: appType.application_id,
                    doc_id: document.doc_id,
                },
            });
        }
    }
    for (const evaluator of evaluatorData) {
        await evaluatorRegisterForSeeder(evaluator);
    }

    await prisma.placementData.createMany({
        data: placementRecords.map((record) => ({
            collegeCode: record.collegeCode,
            collegeName: record.collegeName,
            state: record.state,
            university: record.university,
            academicYear: record.academicYear,
            academicSession: record.academicSession,
            eligibleStudents: record.eligibleStudents,
            studentsPlaced: record.studentsPlaced,
            placementPercent: record.placementPercent,
            avgSalaryLpa: record.avgSalaryLpa,
            corePlacementPercent: record.corePlacementPercent,
            industryMoUs: record.industryMoUs,
            internshipsCount: record.internshipsCount,
            higherEducationPercent: record.higherEducationPercent,
            complianceRemarks: record.complianceRemarks,
            aiScore: null,
            riskLevel: null,
            analysisJson: null
        }))
    });

    const placementColleges = [...new Set(placementRecords.map((record) => record.collegeCode))];

    for (const collegeCode of placementColleges) {
        const history = await prisma.placementData.findMany({
            where: { collegeCode },
            orderBy: { academicYear: "asc" }
        });
        const scoring = calculatePlacementScore(history);
        const latest = history[history.length - 1];
        await prisma.placementData.update({
            where: {
                collegeCode_academicYear: {
                    collegeCode,
                    academicYear: latest.academicYear
                }
            },
            data: {
                aiScore: scoring.placementScore,
                riskLevel: scoring.riskLevel,
                analysisJson: scoring
            }
        });
    }

    const nirfComponentsSample = [
        { key: "tlr", label: "Teaching, Learning & Resources", score: 74.2, weight: 0.4 },
        { key: "rpc", label: "Research & Professional Practice", score: 58.5, weight: 0.2 },
        { key: "go", label: "Graduation Outcomes", score: 68.9, weight: 0.2 },
        { key: "oi", label: "Outreach & Inclusivity", score: 72.4, weight: 0.1 },
        { key: "pr", label: "Perception", score: 65.1, weight: 0.1 }
    ];

    const nirfFinalScore = nirfComponentsSample.reduce((total, component) => total + component.score * component.weight, 0);

    await prisma.nirfRun.create({
        data: {
            instituteId: testUniversity.id,
            academicYear: 2025,
            status: "COMPLETED",
            finalScore: Number(nirfFinalScore.toFixed(2)),
            jobId: "seed-nirf-job",
            uploadKey: "/seed/nirf_sample.xlsx",
            originalFileName: "nirf_sample.xlsx",
            components: {
                create: nirfComponentsSample.map((component) => ({
                    key: component.key,
                    label: component.label,
                    score: component.score,
                    weight: component.weight
                }))
            }
        }
    });

    // ============================================================================
    // SEED UGC DOCUMENTS (matching frontend ugcApprovalConfig.ts)
    // ============================================================================
    console.log("Seeding UGC documents...");
    
    const slugify = (value) =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

    const createUgcDocument = (sectionTitle, docTitle) => {
        const fullTitle = sectionTitle ? `${sectionTitle} – ${docTitle}` : docTitle;
        return {
            doc_id: slugify(fullTitle),
            doc_name: fullTitle,
        };
    };

    const ugcDocumentDefinitions = [
        {
            appId: "ugc_new_university",
            sections: [
                {
                    title: "Part A: Legal & Statutory",
                    documents: [
                        "State Act / Gazette Notification",
                        "Trust / Society Registration Certificate",
                        "Trust Deed / MoA / Bye-laws",
                        "Sponsoring Body Incorporation Certificate",
                        "Non-profit & Single-campus Affidavit",
                    ],
                },
                {
                    title: "Part B: Land & Infrastructure",
                    documents: [
                        "Land ownership documents",
                        "Land use certificate",
                        "Approved building plans",
                        "Completion / Occupancy Certificate",
                        "Campus master plan",
                        "Infrastructure photographs/videos",
                    ],
                },
                {
                    title: "Part C: Academic",
                    documents: [
                        "Program list (UGC permitted)",
                        "Curriculum & syllabus (BoS approved)",
                        "Academic calendar",
                        "Examination regulations",
                        "Faculty list with qualifications & appointment letters",
                        "Student–teacher ratio statement",
                        "Library resources details",
                    ],
                },
                {
                    title: "Part D: Governance & Administration",
                    documents: [
                        "Appointment letters (Chancellor, VC, Registrar)",
                        "Statutory bodies constitution",
                        "Minutes of statutory meetings",
                        "Organizational chart",
                        "HR & service rules",
                    ],
                },
                {
                    title: "Part E: Financial",
                    documents: [
                        "Audited financial statements (last 3 years)",
                        "Income & expenditure statements",
                        "Balance sheets",
                        "Fee structure approval",
                        "Endowment fund proof",
                    ],
                },
                {
                    title: "Part F: Mandatory Compliance",
                    documents: [
                        "Anti-ragging compliance",
                        "Student grievance redressal mechanism",
                        "Internal Complaints Committee (ICC)",
                        "Sexual harassment prevention policy",
                        "Anti-discrimination policy",
                        "No off-campus / franchise affidavit",
                    ],
                },
            ],
        },
    ];

    for (const appDef of ugcDocumentDefinitions) {
        for (const section of appDef.sections) {
            for (const docTitle of section.documents) {
                const docData = createUgcDocument(section.title, docTitle);
                
                // Create document in Document table
                await prisma.document.upsert({
                    where: { doc_id: docData.doc_id },
                    update: {},
                    create: {
                        doc_id: docData.doc_id,
                        doc_name: docData.doc_name,
                        format_uri: null,
                        deadline: new Date("2025-01-01T00:00:00.000Z"),
                        role: "UGC",
                        category: section.title,
                        priority: "MEDIUM",
                    },
                });

                // Link document to application type
                await prisma.applicationDocuments.upsert({
                    where: {
                        application_id_doc_id: {
                            application_id: appDef.appId,
                            doc_id: docData.doc_id,
                        },
                    },
                    update: {},
                    create: {
                        application_id: appDef.appId,
                        doc_id: docData.doc_id,
                    },
                });
            }
        }
    }

    console.log("✅ UGC documents seeded successfully!");
}
seed()
    .then(() => {
        console.log("Database seeded successfully!");
    })
    .catch((error) => {
        console.error("Error seeding database: ", error);
    });