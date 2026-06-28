const prisma = require('./api/utils/db');

async function checkUgcTypes() {
  try {
    const types = await prisma.applicationTypes.findMany({
      where: { application_id: { startsWith: 'ugc' } },
      select: { application_id: true, application_name: true, application_description: true }
    });
    console.log('UGC Application Types:', JSON.stringify(types, null, 2));
    
    // Check ALL documents
    const allDocs = await prisma.document.findMany({
      select: { doc_id: true, doc_name: true, role: true }
    });
    console.log('\nTotal documents in database:', allDocs.length);
    
    // Check UGC documents
    const ugcDocs = allDocs.filter(d => d.doc_id.startsWith('ugc') || d.doc_id.includes('part-'));
    console.log('UGC-related documents:', ugcDocs.length);
    if (ugcDocs.length > 0) {
      console.log('Sample:', ugcDocs.slice(0, 3));
    }
    
    // Check documents with slugified names
    const slugifiedDocs = allDocs.filter(d => d.doc_id.includes('part-') || d.doc_id.includes('legal') || d.doc_id.includes('statutory'));
    console.log('Documents with relevant keywords:', slugifiedDocs.length);
    if (slugifiedDocs.length > 0) {
      console.log('Sample:', slugifiedDocs.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUgcTypes();
