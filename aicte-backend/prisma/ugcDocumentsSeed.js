const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ugcDocuments = [
  // Part A – Legal & Statutory
  {
    doc_id: 'ugc_legal_statutory_1',
    doc_name: 'UGC Act Compliance Certificate',
    role: 'UGC',
    category: 'Part A – Legal & Statutory',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_legal_statutory_2',
    doc_name: 'AICTE Approval Letter',
    role: 'UGC',
    category: 'Part A – Legal & Statutory',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  // Part B – Land & Infrastructure
  {
    doc_id: 'ugc_land_infra_1',
    doc_name: 'Land Ownership Document',
    role: 'UGC',
    category: 'Part B – Land & Infrastructure',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_land_infra_2',
    doc_name: 'Building Safety Certificate',
    role: 'UGC',
    category: 'Part B – Land & Infrastructure',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  // Part C – Academic
  {
    doc_id: 'ugc_academic_1',
    doc_name: 'Academic Calendar',
    role: 'UGC',
    category: 'Part C – Academic',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_academic_2',
    doc_name: 'Faculty List',
    role: 'UGC',
    category: 'Part C – Academic',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  // Part D – Governance & Administration
  {
    doc_id: 'ugc_governance_1',
    doc_name: 'Governing Body Resolution',
    role: 'UGC',
    category: 'Part D – Governance & Administration',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_governance_2',
    doc_name: 'Organizational Structure Chart',
    role: 'UGC',
    category: 'Part D – Governance & Administration',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  // Part E – Financial
  {
    doc_id: 'ugc_financial_1',
    doc_name: 'Audited Financial Statement',
    role: 'UGC',
    category: 'Part E – Financial',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_financial_2',
    doc_name: 'Bank Solvency Certificate',
    role: 'UGC',
    category: 'Part E – Financial',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  // Part F – Mandatory Compliance
  {
    doc_id: 'ugc_compliance_1',
    doc_name: 'Anti-Ragging Affidavit',
    role: 'UGC',
    category: 'Part F – Mandatory Compliance',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
  {
    doc_id: 'ugc_compliance_2',
    doc_name: 'Fire Safety Certificate',
    role: 'UGC',
    category: 'Part F – Mandatory Compliance',
    deadline: new Date(),
    priority: 'MEDIUM',
  },
];

async function main() {
  for (const doc of ugcDocuments) {
    await prisma.document.upsert({
      where: { doc_id: doc.doc_id },
      update: {},
      create: doc,
    });
  }
  console.log('✅ UGC documents seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding UGC documents:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });