const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRecentApplications() {
  try {
    console.log("Checking recent UGC applications...\n");
    
    const applications = await prisma.universityApplication.findMany({
      where: {
        application: {
          application_name: "UGC"
        }
      },
      include: {
        application: true,
        _count: {
          select: { UniversityDocuments: true }
        }
      },
      orderBy: {
        createdOn: 'desc'
      },
      take: 5
    });

    console.log(`Found ${applications.length} recent UGC applications:\n`);
    
    for (const app of applications) {
      console.log(`Application ID: ${app.uni_application_id}`);
      console.log(`Type: ${app.application.application_name}`);
      console.log(`Status: ${app.status}`);
      console.log(`Documents: ${app._count.UniversityDocuments}`);
      console.log(`Created: ${app.createdOn}`);
      console.log(`Submitted: ${app.submittedAt || 'Not submitted'}`);
      console.log(`---`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentApplications();
