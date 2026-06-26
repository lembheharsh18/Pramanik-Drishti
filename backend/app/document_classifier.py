import io
import zipfile
from collections import Counter, defaultdict

import pdfplumber


DOCUMENT_SIGNATURES = {
    "itr": {
        "primary": [
            "assessment year",
            "gross total income",
            "income tax return",
            "itr-v",
            "acknowledgement number",
            "permanent account number",
            "net taxable income",
            "total tax payable",
            "refund",
            "e-filing",
        ],
        "secondary": [
            "pan",
            "ay 20",
            "assessment",
            "tds",
            "form 26as",
            "salary income",
            "house property",
            "capital gains",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "salary_slip": {
        "primary": [
            "gross salary",
            "gross pay",
            "basic salary",
            "pay slip",
            "salary slip",
            "payslip",
            "net pay",
            "net salary",
            "employee id",
            "pay period",
            "provident fund",
            "professional tax",
        ],
        "secondary": [
            "hra",
            "allowance",
            "deductions",
            "pf",
            "esic",
            "tds",
            "ctc",
            "month",
            "designation",
            "department",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "land_record": {
        "primary": [
            "7/12",
            "satbara",
            "khatedar",
            "survey number",
            "land record",
            "taluka",
            "village",
            "gat number",
            "khasra",
            "khata",
            "patta",
            "pattedar",
            "jamabandi",
            "bhulekh",
        ],
        "secondary": [
            "area",
            "hectare",
            "district",
            "tehsildar",
            "tahsildar",
            "registrar",
            "mutation",
            "owner",
            "cultivator",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "sale_deed": {
        "primary": [
            "sale deed",
            "vendor",
            "vendee",
            "transferor",
            "transferee",
            "stamp duty",
            "sub-registrar",
            "registered on",
            "registration number",
            "conveyance deed",
            "absolute sale",
        ],
        "secondary": [
            "consideration",
            "buyer",
            "seller",
            "property",
            "schedule",
            "witnesses",
            "notary",
            "executed",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "valuation_report": {
        "primary": [
            "valuation report",
            "market value",
            "fair value",
            "registered valuer",
            "valuation date",
            "date of valuation",
            "estimated value",
            "valuation certificate",
            "property value",
        ],
        "secondary": [
            "valuer",
            "inspection",
            "locality",
            "built-up area",
            "carpet area",
            "depreciation",
            "replacement cost",
            "guideline value",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "business_registration": {
        "primary": [
            "certificate of incorporation",
            "memorandum of association",
            "articles of association",
            "partnership deed",
            "mca",
            "registrar of companies",
            "cin number",
            "udyam",
            "msme registration",
        ],
        "secondary": [
            "director",
            "authorized capital",
            "paid-up capital",
            "registered office",
            "promoter",
            "llp",
            "pvt ltd",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "gst_returns": {
        "primary": [
            "gstr",
            "gstin",
            "goods and services tax",
            "gst return",
            "taxable turnover",
            "outward supplies",
            "inward supplies",
            "input tax credit",
            "gst paid",
        ],
        "secondary": [
            "b2b",
            "b2c",
            "hsn",
            "cgst",
            "sgst",
            "igst",
            "tax period",
            "filing date",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "balance_sheet": {
        "primary": [
            "balance sheet",
            "profit and loss",
            "assets",
            "liabilities",
            "capital account",
            "reserves and surplus",
            "fixed assets",
            "current assets",
            "chartered accountant",
        ],
        "secondary": [
            "depreciation",
            "turnover",
            "net profit",
            "gross profit",
            "shareholders",
            "equity",
            "auditor",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "bank_statement": {
        "primary": [
            "bank statement",
            "account statement",
            "opening balance",
            "closing balance",
            "credit",
            "debit",
            "transaction",
            "ifsc",
            "account number",
        ],
        "secondary": [
            "neft",
            "rtgs",
            "imps",
            "upi",
            "cheque",
            "deposit",
            "withdrawal",
            "interest",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "property_tax_receipt": {
        "primary": [
            "property tax",
            "house tax",
            "municipal tax",
            "nagar palika",
            "nagar nigam",
            "gram panchayat",
            "property assessment",
            "tax receipt",
        ],
        "secondary": [
            "ward",
            "plot number",
            "assessment number",
            "owner name",
            "financial year",
            "paid",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "noc": {
        "primary": [
            "no objection certificate",
            "noc",
            "no objection",
            "clearance certificate",
            "permission certificate",
        ],
        "secondary": [
            "authority",
            "objection",
            "approved",
            "sanctioned",
            "issued",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "identity_proof": {
        "primary": [
            "aadhaar",
            "aadhar",
            "unique identification",
            "uidai",
            "voter id",
            "driving licence",
            "passport number",
            "date of birth",
        ],
        "secondary": ["name", "address", "gender", "nationality", "photograph"],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "mutation_application": {
        "primary": [
            "mutation",
            "dakhil kharij",
            "name transfer",
            "transfer of ownership",
            "revenue department",
            "mutation number",
            "mutation application",
        ],
        "secondary": [
            "tehsildar",
            "patwari",
            "khasra",
            "khata",
            "applicant",
            "previous owner",
            "new owner",
        ],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
    "ca_certificate": {
        "primary": [
            "chartered accountant",
            "ca certificate",
            "membership number",
            "icai",
            "certified that",
            "net worth certificate",
            "income certificate",
        ],
        "secondary": ["ca", "practicing", "firm name", "udin", "certified"],
        "weight_primary": 3,
        "weight_secondary": 1,
    },
}


def score_document(text: str, doc_type: str) -> int:
    signature = DOCUMENT_SIGNATURES.get(doc_type)
    if not signature:
        return 0

    score = 0
    for keyword in signature["primary"]:
        if keyword in text:
            score += signature["weight_primary"]

    for keyword in signature["secondary"]:
        if keyword in text:
            score += signature["weight_secondary"]

    return score


def classify_document(file_bytes: bytes, filename: str = "") -> dict:
    text = _extract_text_from_pdf(file_bytes).lower()
    all_scores = {
        doc_type: score_document(text, doc_type)
        for doc_type in DOCUMENT_SIGNATURES
    }
    winning_type, highest_score = max(all_scores.items(), key=lambda item: item[1])

    if highest_score == 0:
        return {
            "doc_type": "unknown",
            "confidence": "low",
            "score": 0,
            "filename": filename,
        }

    if highest_score >= 6:
        confidence = "high"
    elif highest_score >= 3:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "doc_type": winning_type,
        "confidence": confidence,
        "score": highest_score,
        "all_scores": all_scores,
        "filename": filename,
    }


def classify_multiple(files: list[tuple[str, bytes]]) -> list[dict]:
    results = [
        classify_document(file_bytes, filename)
        for filename, file_bytes in files
    ]
    type_counts = Counter(result["doc_type"] for result in results)
    duplicate_indexes = defaultdict(int)

    for result in results:
        doc_type = result["doc_type"]
        if type_counts[doc_type] > 1:
            duplicate_indexes[doc_type] += 1
            result["duplicate_index"] = duplicate_indexes[doc_type]

    return results


def classify_from_zip(zip_bytes: bytes) -> list[dict]:
    files = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        for member in archive.infolist():
            filename = member.filename
            normalized_filename = filename.replace("\\", "/")

            if member.is_dir() or normalized_filename.startswith("__MACOSX/"):
                continue

            if not normalized_filename.lower().endswith(".pdf"):
                continue

            files.append((filename, archive.read(member)))

    return classify_multiple(files)


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_texts = [page.extract_text() or "" for page in pdf.pages]
        extracted_text = "\n".join(page_texts)
        if extracted_text.strip():
            return extracted_text
    except Exception:
        pass

    return file_bytes.decode("utf-8", errors="ignore")


if __name__ == "__main__":
    # Quick test - create a fake PDF-like bytes object with keywords.
    test_bytes = b"%PDF fake itr document assessment year gross total income pan number"
    result = classify_document(test_bytes, "test_itr.pdf")
    print(result)
