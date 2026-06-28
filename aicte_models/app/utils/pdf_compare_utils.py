import fitz  # PyMuPDF
import re
import json
from difflib import SequenceMatcher, ndiff
from typing import Dict, List, Tuple, Any
from collections import Counter
from groq import Groq
from fastapi import  HTTPException
from tempfile import NamedTemporaryFile
import logging
import os

groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not defined.")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

STOPWORDS = {
    "the",
    "and",
    "with",
    "for",
    "from",
    "this",
    "that",
    "shall",
    "hereby",
    "thereof",
    "whereas",
    "of",
    "in",
    "to",
    "a",
    "an",
}


def extract_pdf_text(pdf_path):
  try:
    doc = fitz.open(pdf_path)
    pages_content = []
    for page in doc:
        text = page.get_text()
        pages_content.append(text)
    return pages_content
  except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        raise

def normalize_text(text):
    return re.sub(r'\s+|<[^>]+>', '', text)

def split_text_with_placeholders(text):
    parts = re.split(r'(<[^>]+>)', text)
    return [part for part in parts if part]

def find_placeholder_values(template, filled, page):
    placeholder_values = {}
    template_parts = re.split(r'(<[^>]+>)', template)
    filled_parts = []
    current_pos = 0

    for part in template_parts:
        if part.startswith('<') and part.endswith('>'):
            placeholder = part[1:-1]
            if current_pos < len(filled):
                next_fixed_text = next((p for p in template_parts[template_parts.index(part)+1:] if not (p.startswith('<') and p.endswith('>'))), None)

                if next_fixed_text:
                    next_pos = filled.find(next_fixed_text, current_pos)
                    if next_pos != -1:
                        value = filled[current_pos:next_pos].strip()
                    else:
                        value = filled[current_pos:].strip()
                else:
                    value = filled[current_pos:].strip()

                bbox = get_bbox(page, value)
                placeholder_values[placeholder] = {"value": value.split("/n")[0].split(".")[0], "bbox": bbox}
                filled_parts.append(value)
                current_pos = next_pos if next_fixed_text and next_pos != -1 else len(filled)
        else:
            match_pos = filled.find(part, current_pos)
            if match_pos != -1:
                if match_pos > current_pos:
                    filled_parts.append(filled[current_pos:match_pos])
                filled_parts.append(part)
                current_pos = match_pos + len(part)

    if current_pos < len(filled):
        filled_parts.append(filled[current_pos:])

    return placeholder_values, ' '.join(filled_parts)

def get_bbox(page, text):
  try:
    words = page.get_text("words")
    text_words = text.split()
    start_word = text_words[0]
    end_word = text_words[-1]

    start_bbox = None
    end_bbox = None

    for word in words:
        if word[4].startswith(start_word) and start_bbox is None:
            start_bbox = word[:4]
        if word[4].endswith(end_word):
            end_bbox = word[:4]
            break

    if start_bbox and end_bbox:
        return [
            min(start_bbox[0], end_bbox[0]),
            min(start_bbox[1], end_bbox[1]),
            max(start_bbox[2], end_bbox[2]),
            max(start_bbox[3], end_bbox[3])
        ]
    return None
  except:
    return None

def detect_layout_errors(template, filled, template_page, filled_page):
    errors = []
    layout_similarity = 1.0
    template_lines = template.split('\n')
    filled_lines = filled.split('\n')

    if len(template_lines) != len(filled_lines):
        errors.append({
            "issue": "Line count mismatch",
            "description": f"Template has {len(template_lines)} lines, filled has {len(filled_lines)} lines",
            "location": get_bbox(template_page, template),
            "page_width": template_page.rect.width,
            "page_height": template_page.rect.height,
            "page_source": "template",
        })

    for i in range(max(len(template_lines), len(filled_lines))):
        template_line = template_lines[i] if i < len(template_lines) else ''
        filled_line = filled_lines[i] if i < len(filled_lines) else ''

        if template_line.strip() and not filled_line.strip():
            errors.append({
                "issue": "Missing content",
                "description": f"Line {i + 1} is missing in the submitted document",
                "location": get_bbox(template_page, template_line),
                "page_width": template_page.rect.width,
                "page_height": template_page.rect.height,
                "page_source": "template",
            })
            continue

        if filled_line.strip() and not template_line.strip():
            errors.append({
                "issue": "Extra content",
                "description": f"Line {i + 1} exists only in the submitted document",
                "location": get_bbox(filled_page, filled_line),
                "page_width": filled_page.rect.width,
                "page_height": filled_page.rect.height,
                "page_source": "filled",
            })
            continue

        template_parts = split_text_with_placeholders(template_line)
        filled_parts = split_text_with_placeholders(filled_line)

        j = 0
        k = 0
        while j < len(template_parts) and k < len(filled_parts):
            if template_parts[j].startswith('<') and template_parts[j].endswith('>'):
                j += 1
                continue

            if filled_parts[k].startswith('<') and filled_parts[k].endswith('>'):
                k += 1
                continue

            template_part = normalize_text(template_parts[j])
            filled_part = normalize_text(filled_parts[k])

            if not template_part and not filled_part:
                j += 1
                k += 1
                continue

            similarity = SequenceMatcher(None, template_part, filled_part).ratio()
            if similarity >= 0.9:
                j += 1
                k += 1
                continue

            issue_type = "Text mismatch" if similarity >= 0.4 else "Modified sections"
            bbox = get_bbox(template_page, template_parts[j]) or get_bbox(filled_page, filled_parts[k])
            errors.append({
                "issue": issue_type,
                "description": f"Difference detected on line {i + 1}",
                "template_part": template_parts[j],
                "filled_part": filled_parts[k],
                "location": bbox,
                "page_width": template_page.rect.width,
                "page_height": template_page.rect.height,
                "page_source": "template",
            })

            j += 1
            k += 1

    template_normalized = normalize_text(template)
    filled_normalized = normalize_text(filled)
    if template_normalized and filled_normalized:
        layout_similarity = SequenceMatcher(None, template_normalized, filled_normalized).ratio()
        if layout_similarity < 0.75:
            errors.append({
                "issue": "Layout mismatch",
                "description": f"Overall layout similarity {layout_similarity:.2f} on page",
                "location": None,
                "page_width": template_page.rect.width,
                "page_height": template_page.rect.height,
                "page_source": "template",
            })

    return errors, layout_similarity

def extract_key_phrases(text: str, max_phrases: int = 8) -> List[str]:
    cleaned = re.sub(r'<[^>]+>', ' ', text or "")
    uppercase_phrases = re.findall(r'\b[A-Z][A-Z\s]{3,}\b', cleaned)
    phrases: List[str] = []
    for phrase in uppercase_phrases:
        normalized = re.sub(r'\s+', ' ', phrase).strip()
        if normalized and normalized not in phrases:
            phrases.append(normalized)

    words = [
        word
        for word in re.findall(r'\b[a-zA-Z]{5,}\b', cleaned.lower())
        if word not in STOPWORDS
    ]
    if words:
        for word, _count in Counter(words).most_common(max_phrases):
            candidate = word.title()
            if candidate not in phrases:
                phrases.append(candidate)

    return phrases[:max_phrases]

def match_keyword_phrases(template_text: str, filled_text: str) -> Dict[str, Any]:
    phrases = extract_key_phrases(template_text)
    filled_lower = (filled_text or "").lower()
    matched = []
    missing = []
    for phrase in phrases:
        if phrase.lower() in filled_lower:
            matched.append(phrase)
        else:
            missing.append(phrase)

    total = len(phrases)
    match_percentage = round((len(matched) / total) * 100, 2) if total else 0.0

    return {
        "phrases_checked": phrases,
        "matched": matched,
        "missing": missing,
        "match_percentage": match_percentage,
    }

def compare_layouts(pdf1_path, pdf2_path):
  try:
    doc1 = fitz.open(pdf1_path)
    doc2 = fitz.open(pdf2_path)
    
    all_placeholder_values = {}
    layout_issues = []

    template_text_chunks = []
    filled_text_chunks = []
    total_layout_similarity = 0.0
    compared_pages = min(len(doc1), len(doc2))

    if len(doc1) != len(doc2):
        layout_issues.append({
            "issue": "Structural anomalies",
            "description": f"Template has {len(doc1)} pages, submitted document has {len(doc2)} pages",
            "location": "Entire document",
            "page_width": None,
            "page_height": None,
            "page_source": "template",
        })

    for page_num in range(compared_pages):
        page1 = doc1[page_num]
        page2 = doc2[page_num]
        text1 = page1.get_text()
        text2 = page2.get_text()
        template_text_chunks.append(text1)
        filled_text_chunks.append(text2)

        placeholder_values, reconstructed_text = find_placeholder_values(text1, text2, page2)
        all_placeholder_values.update(placeholder_values)

        page_errors, page_similarity = detect_layout_errors(text1, text2, page1, page2)
        total_layout_similarity += page_similarity
        for error in page_errors:
            error["page"] = page_num + 1
            layout_issues.append(error)

    doc1.close()
    doc2.close()

    layouts_similar = len(layout_issues) == 0

    combined_template = " ".join(template_text_chunks)
    combined_filled = " ".join(filled_text_chunks)
    normalized_template = normalize_text(combined_template)
    normalized_filled = normalize_text(combined_filled)

    format_ratio = (
        SequenceMatcher(None, normalized_template, normalized_filled).ratio()
        if normalized_template and normalized_filled
        else 0.0
    )
    layout_match_score = (
        (total_layout_similarity / compared_pages) if compared_pages else 0.0
    )

    keyword_match = match_keyword_phrases(combined_template, combined_filled)

    metrics = {
        "format_match_percentage": round(format_ratio * 100, 2),
        "layout_match_score": round(layout_match_score * 100, 2),
        "keyword_phrase_match": keyword_match,
    }

    return layouts_similar, all_placeholder_values, layout_issues, metrics
  except Exception as e:
        logging.error(f"Error comparing layouts: {e}")
        raise

def check_with_groq(placeholder_values):
    client = Groq(api_key=groq_api_key)

    prompt = f"""
Analyze the following placeholder values:

{json.dumps(placeholder_values, indent=2)}

For each placeholder value, perform the following analysis:

1. Ignore the `bbox` key in your evaluation; it's used for other purposes.

2. Evaluate if the value is valid and appropriate for the placeholder name using these criteria:
   a. The value should not be identical to the placeholder name (e.g., "<Name>" is invalid for a <Name> placeholder).
   b. The value should align with the expected information type suggested by the placeholder name.
   c. The value should be realistic and contextually appropriate for Indian documents (e.g., forms, contracts, affidavits, academic records).
   d. The value should not contain placeholder-like terms (e.g., <Field>, [Enter Text Here]) or generic phrases that don't represent actual data.

3. Consider the placeholder names as general indicators of the expected data type, but avoid assuming overly strict formats unless explicitly implied by the name.

4. Be aware of potential variations in Indian naming conventions, address formats, and document-specific terminology.

5. For numerical fields, check if the value is within a reasonable range for the given context (e.g., age, year of birth, pin code).

6. For date fields, verify that the date is in a valid format and represents a plausible date (e.g., not in the future for a birth date).

7. For address fields, check for the presence of key components (e.g., street, city, state) without being overly strict about the exact format.

8. For name fields, allow for variations in Indian naming conventions, including the possibility of single-word names or the use of initials.

Respond with a JSON object containing:
While resonping consider all the above points of prompt
1. `placeholder_analysis`: A dictionary with placeholder names as keys and analysis results as values. Each analysis should include:
   - `is_valid`: A boolean indicating if the value is valid after considering the above criteria (true for valid, false for invalid).
   - `confidence`: A float between 0 and 1 indicating the confidence level of the validity assessment.
   - `issues`: An array of strings describing any identified issues. If the value is valid, this array should be empty.
   - `suggestions`: An array of strings providing potential fixes or improvements for invalid values. If the value is valid, this array should be empty.
Ensure that your analysis is balanced and considers the possibility of valid but unconventional data. If you're unsure about the validity of a value, lean towards marking it as valid with a lower confidence score rather than immediately flagging it as invalid.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=False,
            response_format={"type": "json_object"},
            stop=None,
        )

        groq_analysis = json.loads(completion.choices[0].message.content)

        # Update placeholder values with Groq's analysis
        for placeholder, analysis in groq_analysis["placeholder_analysis"].items():
            if placeholder in placeholder_values:
                placeholder_values[placeholder]["analysis"] = analysis

        # Replace layout issues with improved versions

        return placeholder_values
    except Exception as e:
        logging.error(f"Error finding bounding box: {e}")
        return placeholder_values


def summarize_layout_issues(layout_issues: List[Dict[str, Any]]) -> Dict[str, int]:
    summary = {
        "line_count_mismatch": 0,
        "layout_mismatch": 0,
        "text_mismatch": 0,
        "modified_sections": 0,
        "missing_content": 0,
        "extra_content": 0,
        "structural_anomalies": 0,
    }

    mapping = {
        "line count mismatch": "line_count_mismatch",
        "layout mismatch": "layout_mismatch",
        "text mismatch": "text_mismatch",
        "modified sections": "modified_sections",
        "missing content": "missing_content",
        "extra content": "extra_content",
        "structural anomalies": "structural_anomalies",
        "different number of pages": "structural_anomalies",
    }

    for issue in layout_issues:
        issue_name = issue.get("issue", "").lower()
        key = mapping.get(issue_name)
        if key:
            summary[key] += 1

    return summary


# ============================================================================
# LIGHTWEIGHT TEXT CLASSIFICATION - Using TF-IDF + Rule-Based Approach
# ============================================================================
# This implementation combines:
# 1. Rule-based keyword matching for quick classification
# 2. TF-IDF vectorization for better accuracy (optional, lightweight)
# 3. Groq API for complex cases (already integrated)
# 
# Benefits:
# - No heavy transformer models needed
# - Fast CPU-based processing
# - Good accuracy for document classification
# - Minimal memory footprint
# ============================================================================

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize TF-IDF vectorizer (lightweight alternative to BERT)
tfidf_vectorizer = TfidfVectorizer(
    max_features=1000,
    stop_words='english',
    ngram_range=(1, 2)
)

# Legal document templates for comparison
LEGAL_DOCUMENT_TEMPLATES = [
    "affidavit declaration hereby witness signature seal notary",
    "agreement contract terms conditions party clause executed",
    "certificate undertaking declaration dated signed authorized",
    "legal document formal official government institution",
    "memorandum understanding parties agreement obligations rights"
]

# Pre-fit the vectorizer with legal templates
try:
    tfidf_vectorizer.fit(LEGAL_DOCUMENT_TEMPLATES)
except Exception as e:
    logging.warning(f"Could not fit TF-IDF vectorizer: {e}")

def classify_text_tfidf(text):
    """
    Enhanced text classification using TF-IDF similarity.
    Returns True if text appears to be legal/formal, False otherwise.
    """
    try:
        # Transform the input text
        text_vector = tfidf_vectorizer.transform([text])
        
        # Transform legal templates
        template_vectors = tfidf_vectorizer.transform(LEGAL_DOCUMENT_TEMPLATES)
        
        # Calculate cosine similarity
        similarities = cosine_similarity(text_vector, template_vectors)
        max_similarity = similarities.max()
        
        # If similarity is above threshold, classify as legal
        return max_similarity > 0.3
    except Exception as e:
        logging.warning(f"TF-IDF classification failed: {e}. Falling back to rule-based.")
        return classify_text_rules(text)

def classify_text_rules(text):
    """
    Rule-based classifier for legal documents.
    Returns True if text appears to be legal/formal, False otherwise.
    """
    # Legal document keywords
    legal_keywords = [
        'affidavit', 'hereby', 'whereas', 'agreement', 'contract',
        'undertaking', 'declaration', 'certificate', 'notary',
        'witness', 'signature', 'seal', 'dated', 'executed',
        'party', 'clause', 'terms', 'conditions', 'legal',
        'memorandum', 'authorized', 'official', 'government',
        'institution', 'obligations', 'rights', 'provisions'
    ]
    
    # Formal document indicators
    formal_patterns = [
        'pursuant to', 'in accordance with', 'subject to',
        'notwithstanding', 'hereinafter', 'aforementioned',
        'undersigned', 'duly authorized', 'in witness whereof'
    ]
    
    text_lower = text.lower()
    
    # Count keyword matches
    keyword_count = sum(1 for keyword in legal_keywords if keyword in text_lower)
    pattern_count = sum(1 for pattern in formal_patterns if pattern in text_lower)
    
    # Calculate score
    score = keyword_count + (pattern_count * 2)
    
    # If document contains sufficient legal indicators, classify as legal
    return score >= 3

def classify_text(text):
    """
    Main classification function that combines multiple approaches.
    
    Priority:
    1. Try TF-IDF classification (fast and accurate)
    2. Fall back to rule-based classification
    3. For complex cases, can use Groq API (already integrated elsewhere)
    """
    # Try TF-IDF first
    try:
        return classify_text_tfidf(text)
    except Exception as e:
        logging.warning(f"TF-IDF classification error: {e}")
        # Fall back to rule-based
        return classify_text_rules(text)


