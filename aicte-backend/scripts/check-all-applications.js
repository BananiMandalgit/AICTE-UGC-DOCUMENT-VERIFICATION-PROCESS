const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAllApplications() {
  try {
    console.log("Checking ALL applications...\n");
    
    // First, check what application types exist
    const appTypes = await prisma.applicationTypes.findMany();
    console.log("Available Application Types:");
    appTypes.forEach(type => console.log(`- ${type.application_name} (ID: ${type.application_id})`));
    console.log("\n");
    
    // Get all university applications
    const applications = await prisma.universityApplication.findMany({
      include: {
        application: true,
        _count: {
          select: { UniversityDocuments: true }
        }
      },
      orderBy: {
        createdOn: 'desc'
      },
      take: 10
    });

    console.log(`Found ${applications.length} total applications:\n`);
    
    for (const app of applications) {
      console.log(`Application ID: ${app.uni_application_id}`);
      console.log(`Type: ${app.application.application_name}`);
      console.log(`Name: ${app.application_name}`);
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

checkAllApplications();
