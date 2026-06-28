"""
Legal Keywords Database
Predefined keyword sets for different document types
"""

from typing import List, Dict

# Affidavit 1: Application verification and compliance
LEGAL_KEYWORDS_AFFIDAVIT1: List[Dict[str, str | int]] = [
    {"keyword": "solemnly affirm and declare", "category": "Legal Phrase", "score": 5},
    {"keyword": "abide by all the terms and conditions", "category": "Compliance", "score": 4},
    {"keyword": "no misrepresentation", "category": "Compliance", "score": 4},
    {"keyword": "true to my/our knowledge", "category": "Legal Phrase", "score": 5},
    {"keyword": "no material facts concealed", "category": "Legal Phrase", "score": 4},
    {"keyword": "verification", "category": "Legal Section", "score": 5},
    {"keyword": "sworn before", "category": "Legal Phrase", "score": 5},
    {"keyword": "judicial first class magistrate", "category": "Authority", "score": 5},
    {"keyword": "notary public", "category": "Authority", "score": 5},
    {"keyword": "oath commissioner", "category": "Authority", "score": 5},
    {"keyword": "non-judicial stamp paper", "category": "Legal Format", "score": 4},
    {"keyword": "e-stamp paper", "category": "Legal Format", "score": 4},
]

# Affidavit 2: Sworn statement of data accuracy
LEGAL_KEYWORDS_AFFIDAVIT2: List[Dict[str, str | int]] = [
    {"keyword": "solemnly affirm and declare", "category": "Legal Phrase", "score": 5},
    {"keyword": "true and complete", "category": "Legal Assurance", "score": 5},
    {"keyword": "nothing is false", "category": "Legal Assurance", "score": 4},
    {"keyword": "no information/ material has been concealed", "category": "Compliance", "score": 5},
    {"keyword": "abide by all terms and conditions", "category": "Compliance", "score": 5},
    {"keyword": "competent authority", "category": "Authority", "score": 4},
    {"keyword": "valid fire safety certificate", "category": "Certificate", "score": 5},
    {"keyword": "structural stability certificate", "category": "Certificate", "score": 5},
    {"keyword": "occupancy", "category": "Infrastructure", "score": 4},
    {"keyword": "completion certificate", "category": "Infrastructure", "score": 5},
    {"keyword": "building license", "category": "Infrastructure", "score": 4},
    {"keyword": "contiguous", "category": "Land Compliance", "score": 4},
    {"keyword": "no dispute pertaining to the said land", "category": "Land Compliance", "score": 5},
    {"keyword": "withdrawal of approval", "category": "Regulatory Action", "score": 5},
    {"keyword": "liable", "category": "Liability Clause", "score": 5},
    {"keyword": "verification", "category": "Verification", "score": 5},
    {"keyword": "sworn before", "category": "Legal Phrase", "score": 5},
    {"keyword": "judicial first class magistrate", "category": "Legal Authority", "score": 5},
    {"keyword": "notary public", "category": "Legal Authority", "score": 5},
    {"keyword": "oath commissioner", "category": "Legal Authority", "score": 5},
    {"keyword": "non-judicial stamp paper", "category": "Legal Format", "score": 4},
    {"keyword": "e-stamp paper", "category": "Legal Format", "score": 4},
]

# Affidavit 5: Compliance Documents
LEGAL_KEYWORDS_AFFIDAVIT5: List[Dict[str, str | int]] = [
    {"keyword": "solemnly affirm and declare", "category": "Legal Phrase", "score": 5},
    {"keyword": "true and complete", "category": "Legal Assurance", "score": 5},
    {"keyword": "nothing is false", "category": "Legal Assurance", "score": 5},
    {"keyword": "no information/ material has been concealed", "category": "Legal Integrity", "score": 5},
    {"keyword": "incomplete, misleading", "category": "Legal Risk", "score": 4},
    {"keyword": "suppress any information", "category": "Legal Phrase", "score": 4},
    {"keyword": "misrepresent the information", "category": "Legal Phrase", "score": 4},
    {"keyword": "withdrawal of approval", "category": "Regulatory Action", "score": 5},
    {"keyword": "complaint arises", "category": "Compliance Risk", "score": 3},
    {"keyword": "inspect the premises", "category": "Regulatory Action", "score": 4},
    {"keyword": "council shall take any action", "category": "Regulatory Enforcement", "score": 5},
    {"keyword": "verification", "category": "Verification", "score": 5},
    {"keyword": "sworn before", "category": "Legal Phrase", "score": 5},
    {"keyword": "judicial first class magistrate", "category": "Legal Authority", "score": 5},
    {"keyword": "notary public", "category": "Legal Authority", "score": 5},
    {"keyword": "oath commissioner", "category": "Legal Authority", "score": 5},
    {"keyword": "non-judicial stamp paper", "category": "Legal Format", "score": 4},
    {"keyword": "e-stamp paper", "category": "Legal Format", "score": 4},
    {"keyword": "fulfilling aicte norms", "category": "Compliance", "score": 5},
    {"keyword": "above named university", "category": "Entity Reference", "score": 3},
]

# Annexure 9: Detailed Project Report
LEGAL_KEYWORDS_ANNEXURE9: List[Dict[str, str | int]] = [
    {
        "keyword": "special purpose vehicle",
        "category": "Legal/Organizational Compliance",
        "score": 5,
    },
    {
        "keyword": "registered entity",
        "category": "Legal Compliance",
        "score": 4,
    },
    {
        "keyword": "minimum three years of operation",
        "category": "Eligibility Requirement",
        "score": 4,
    },
    {
        "keyword": "competent, trained personnel",
        "category": "Staff Compliance",
        "score": 5,
    },
    {
        "keyword": "funding schemes",
        "category": "Financial Compliance",
        "score": 4,
    },
    {
        "keyword": "scrutiny committee",
        "category": "Regulatory Committee",
        "score": 5,
    },
    {
        "keyword": "verify the additional documents",
        "category": "Regulatory Action",
        "score": 4,
    },
    {
        "keyword": "special scrutiny committee",
        "category": "Regulatory Committee",
        "score": 5,
    },
    {
        "keyword": "demonstrate their competency and capability",
        "category": "Regulatory Requirement",
        "score": 4,
    },
    {
        "keyword": "conditions, requirements and eligibility",
        "category": "Compliance Section",
        "score": 4,
    },
    {
        "keyword": "as per annexure-2",
        "category": "Regulatory Reference",
        "score": 3,
    },
    {
        "keyword": "as per clause 2.10",
        "category": "Regulatory Reference",
        "score": 3,
    },
    {
        "keyword": "provided they satisfy following conditions",
        "category": "Compliance Condition",
        "score": 4,
    },
    {
        "keyword": "support student innovators",
        "category": "Compliance Obligation",
        "score": 3,
    },
    {
        "keyword": "capability to manage and support",
        "category": "Capability Requirement",
        "score": 4,
    },
]

# Mapping document IDs to keyword sets
DOCUMENT_RULES: Dict[str, List[Dict[str, str | int]]] = {
    # Original document type IDs
    "affidavit1": LEGAL_KEYWORDS_AFFIDAVIT1,
    "affidavit2": LEGAL_KEYWORDS_AFFIDAVIT2,
    "affidavit5": LEGAL_KEYWORDS_AFFIDAVIT5,
    "annexure9": LEGAL_KEYWORDS_ANNEXURE9,
    # Application-specific document IDs - New Institutions
    "new_institute_0": LEGAL_KEYWORDS_AFFIDAVIT1,
    "new_institute_1": LEGAL_KEYWORDS_AFFIDAVIT2,
    "new_institute_2": LEGAL_KEYWORDS_AFFIDAVIT5,  # Land Ownership documents
    "new_institute_3": LEGAL_KEYWORDS_AFFIDAVIT5,  # ANNEXURE-14: Lease agreement
    "new_institute_4": LEGAL_KEYWORDS_AFFIDAVIT5,  # ANNEXURE-3: Land Use Certificate
    "new_institute_5": LEGAL_KEYWORDS_AFFIDAVIT5,
    "new_institute_6": LEGAL_KEYWORDS_AFFIDAVIT5,  # CERTIFICATE-3: Financial Proof
    "new_institute_7": LEGAL_KEYWORDS_AFFIDAVIT5,  # CERTIFICATE-3: DSC
    "new_institute_8": LEGAL_KEYWORDS_AFFIDAVIT5,  # ANNEXURE-17: Society/Trust/Company Registration
    "new_institute_9": LEGAL_KEYWORDS_AFFIDAVIT5,  # Default mapping for any missing
    "new_institute_10": LEGAL_KEYWORDS_AFFIDAVIT5,
    # EOA documents
    "eoa_0": LEGAL_KEYWORDS_ANNEXURE9,
    "eoa_1": LEGAL_KEYWORDS_ANNEXURE9,
    "eoa_2": LEGAL_KEYWORDS_ANNEXURE9,
    "eoa_3": LEGAL_KEYWORDS_ANNEXURE9,
}
