/**
 * Check specific application status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLICATION_ID = 'Application-9206d1ea-9f71-41f2-9ce9-9fa348e3a42c';

async function checkApplication() {
  console.log(`🔍 Checking application: ${APPLICATION_ID}\n`);

  const app = await prisma.universityApplication.findUnique({
    where: { uni_application_id: APPLICATION_ID },
    include: {
      UniversityDocuments: true
    }
  });

  if (!app) {
    console.log('❌ Application not found!');
    return;
  }

  console.log('📋 Application Details:');
  console.log(`   ID: ${app.uni_application_id}`);
  console.log(`   Name: ${app.application_name}`);
  console.log(`   Status: ${app.status}`);
  console.log(`   Created: ${app.createdOn}`);
  console.log(`   Submitted: ${app.submittedAt || 'Not set'}`);
  console.log(`   Documents: ${app.UniversityDocuments.length}`);
  
  if (app.UniversityDocuments.length > 0) {
    console.log('\n📄 Documents:');
    app.UniversityDocuments.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. doc_id: ${doc.doc_id}, status: ${doc.status}`);
    });
  }

  // Suggest fix if needed
  if (app.status === 'NOT_SUBMITTED' && app.UniversityDocuments.length > 0) {
    console.log('\n⚠️  Application has documents but status is NOT_SUBMITTED');
    console.log('   Updating status to SUBMITTED...');
    
    await prisma.universityApplication.update({
      where: { uni_application_id: APPLICATION_ID },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });
    
    console.log('   ✅ Status updated to SUBMITTED');
  }
}

checkApplication()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
