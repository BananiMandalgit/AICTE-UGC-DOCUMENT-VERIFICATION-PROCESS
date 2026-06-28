type UgcDocument = {
  id: string;
  name: string;
  pdfPath: string;
};

export enum UGCApplicationType {
  NEW_UNIVERSITY = "ugc_new_university",
  EXTENSION_OF_APPROVAL = "ugc_extension_of_approval",
  DEEMED_UNIVERSITY = "ugc_deemed_university",
  CONVERSION_STATUS_CHANGE = "ugc_conversion_status_change",
  CLOSURE_OR_HIBERNATION = "ugc_closure_hibernation",
}

interface UgcChecklistSection {
  title: string;
  documents: string[];
}

interface UgcApplicationConfigEntry {
  key: UGCApplicationType;
  label: string;
  sections: UgcChecklistSection[];
}

const DOC_BASE_URL = "https://www.ugc.gov.in/resources";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createDocument = (sectionTitle: string, docTitle: string): UgcDocument => {
  const fullTitle = sectionTitle ? `${sectionTitle} – ${docTitle}` : docTitle;
  return {
    id: slugify(fullTitle),
    name: fullTitle,
    pdfPath: `${DOC_BASE_URL}/${slugify(docTitle)}.pdf`,
  };
};

const ugcApplications: UgcApplicationConfigEntry[] = [
  {
    key: UGCApplicationType.NEW_UNIVERSITY,
    label: "New University / New Institution",
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
          "Anti-discrimination policy",
          "No off-campus / franchise affidavit",
        ],
      },
    ],
  },
  {
    key: UGCApplicationType.EXTENSION_OF_APPROVAL,
    label: "Extension of Approval (EoA)",
    sections: [
      {
        title: "",
        documents: [
          "Updated program list",
          "Faculty list (current year)",
          "Student intake & enrolment data",
          "Examination results & pass percentage",
          "Annual compliance report",
          "Anti-ragging affidavit (current year)",
          "Grievance redressal report",
          "ICC annual report",
          "No-change affidavit (infrastructure)",
          "Latest audited financial statements",
          "Fee structure (current year)",
          "Utilization certificate",
        ],
      },
    ],
  },
  {
    key: UGCApplicationType.DEEMED_UNIVERSITY,
    label: "Deemed-to-be University Application",
    sections: [
      {
        title: "",
        documents: [
          "Application for Deemed status",
          "Trust / Society documents",
          "NAAC accreditation certificate",
          "NIRF participation / ranking details",
          "Program list",
          "Curriculum (national framework aligned)",
          "Faculty qualifications & experience",
          "Research output details",
          "Faculty publications & funded projects",
          "PhD supervision approvals",
          "Land ownership / lease documents",
          "Building approvals & completion certificates",
          "Audited accounts (3–5 years)",
          "Corpus fund proof",
          "Financial sustainability plan",
        ],
      },
    ],
  },
  {
    key: UGCApplicationType.CONVERSION_STATUS_CHANGE,
    label: "Conversion / Status Change",
    sections: [
      {
        title: "",
        documents: [
          "Government notification / approval for conversion",
          "Revised Act / statutes",
          "Revised governance structure",
          "Updated statutory bodies",
          "Revised program list",
          "Student transition plan",
          "Asset ownership / transfer proof",
          "Infrastructure adequacy statement",
          "Revised financial plan",
        ],
      },
    ],
  },
  {
    key: UGCApplicationType.CLOSURE_OR_HIBERNATION,
    label: "Closure / Hibernation of Institution",
    sections: [
      {
        title: "",
        documents: [
          "Governing Body resolution",
          "State / Government NOC",
          "Student migration / transfer plan",
          "Fee refund details",
          "Faculty & staff settlement records",
          "Termination / redeployment notices",
          "Academic records preservation plan",
          "Asset custody / disposal plan",
        ],
      },
    ],
  },
];

export const ugcApprovalConfig = ugcApplications.reduce<Record<UGCApplicationType, UgcApplicationConfigEntry>>(
  (acc, entry) => {
    acc[entry.key] = entry;
    return acc;
  },
  {} as Record<UGCApplicationType, UgcApplicationConfigEntry>
);

export const buildUgcApplicationTypes = () =>
  ugcApplications.map((application) => ({
    id: application.key,
    name: application.label,
    documents: application.sections.flatMap((section) =>
      section.documents.map((doc) => createDocument(section.title, doc))
    ),
  }));
