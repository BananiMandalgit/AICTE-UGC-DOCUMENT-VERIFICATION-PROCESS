const prisma = require('./api/utils/db');

async function testEvaluatorAssignment() {
  try {
    // Check if johndoe@example.com exists
    const johnDoe = await prisma.evaluator.findUnique({
      where: { email: 'johndoe@example.com' },
      select: {
        evaluator_id: true,
        email: true,
        role: true,
        specialization: true
      }
    });

    console.log('\n✅ Evaluator: johndoe@example.com');
    console.log(JSON.stringify(johnDoe, null, 2));

    // Check all evaluators by role
    const forgeryCheckers = await prisma.evaluator.findMany({
      where: { role: 'FORGERY_CHECKER' },
      select: {
        evaluator_id: true,
        email: true,
        specialization: true
      }
    });

    console.log('\n📋 All FORGERY_CHECKER evaluators:');
    forgeryCheckers.forEach(e => {
      console.log(`  - ${e.email}: ${e.specialization.join(', ')}`);
    });

    // Check if there are any submitted documents waiting for assignment
    const submittedDocs = await prisma.universityDocuments.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        document: true,
        application: {
          select: {
            uni_application_id: true,
            application_name: true,
            status: true
          }
        }
      }
    });

    console.log(`\n📄 Documents with SUBMITTED status: ${submittedDocs.length}`);
    if (submittedDocs.length > 0) {
      submittedDocs.forEach(doc => {
        console.log(`  - ${doc.doc_id} (${doc.document.doc_name})`);
        console.log(`    Application: ${doc.application.application_name} [${doc.application.status}]`);
      });
    }

    // Check assigned documents
    const assignedDocs = await prisma.evaluatorDocumentRelation.findMany({
      where: { evaluator_id: johnDoe?.evaluator_id },
      include: {
        document: {
          include: {
            document: true,
            application: {
              select: {
                uni_application_id: true,
                application_name: true
              }
            }
          }
        }
      }
    });

    console.log(`\n✅ Documents assigned to johndoe@example.com: ${assignedDocs.length}`);
    if (assignedDocs.length > 0) {
      assignedDocs.forEach(rel => {
        console.log(`  - ${rel.document.doc_id} (${rel.check_type})`);
        console.log(`    Status: ${rel.status}`);
        console.log(`    Application: ${rel.document.application.application_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🔍 Testing Evaluator Assignment Setup...\n');
testEvaluatorAssignment();
