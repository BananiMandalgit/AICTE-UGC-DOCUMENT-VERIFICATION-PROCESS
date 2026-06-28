const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    console.log("Checking for documents in the system...\n");
    
    const documents = await prisma.universityDocuments.findMany({
      include: {
        application: {
          include: {
            application: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log(`Found ${documents.length} documents:\n`);
    
    for (const doc of documents) {
      console.log(`Document ID: ${doc.uni_doc_id}`);
      console.log(`Application: ${doc.application.application_name}`);
      console.log(`Application Type: ${doc.application.application.application_name}`);
      console.log(`Application Status: ${doc.application.status}`);
      console.log(`Created: ${doc.timestamp}`);
      console.log(`---`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments();
