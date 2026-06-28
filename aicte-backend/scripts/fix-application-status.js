/**
 * Script to fix application status for applications that have documents
 * but status is still NOT_SUBMITTED (created before the fix)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixApplicationStatus() {
  console.log('🔍 Finding applications with documents but status NOT_SUBMITTED...');

  // Find all applications with documents uploaded but status still NOT_SUBMITTED
  const applicationsToFix = await prisma.universityApplication.findMany({
    where: {
      status: 'NOT_SUBMITTED',
      UniversityDocuments: {
        some: {} // Has at least one document
      }
    },
    include: {
      UniversityDocuments: true
    }
  });

  console.log(`📋 Found ${applicationsToFix.length} applications to fix`);

  if (applicationsToFix.length === 0) {
    console.log('✅ No applications need fixing!');
    return;
  }

  // Update each application
  for (const app of applicationsToFix) {
    console.log(`🔧 Fixing application: ${app.uni_application_id}`);
    console.log(`   Documents: ${app.UniversityDocuments.length}`);
    console.log(`   Current status: ${app.status}`);

    await prisma.universityApplication.update({
      where: { uni_application_id: app.uni_application_id },
      data: {
        status: 'SUBMITTED',
        submittedAt: app.createdOn // Use creation date as submitted date for old apps
      }
    });

    console.log(`   ✅ Updated to: SUBMITTED`);
  }

  console.log('\n✅ All applications fixed!');
}

fixApplicationStatus()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
