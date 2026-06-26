import io
import json
import datetime
import re
import PyPDF2
import pdfplumber

def extract_pdf_metadata(file_bytes: bytes) -> dict:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        meta = reader.metadata or {}
        
        creator = meta.get("/Creator")
        producer = meta.get("/Producer")
        author = meta.get("/Author")
        
        creation_date_raw = meta.get("/CreationDate")
        mod_date_raw = meta.get("/ModDate")
        
        def parse_pdf_date(d_str: str) -> datetime.datetime | None:
            if not d_str:
                return None
            if d_str.startswith("D:"):
                d_str = d_str[2:]
            try:
                return datetime.datetime.strptime(d_str[:14], "%Y%m%d%H%M%S")
            except Exception:
                return None
        
        creation_dt = parse_pdf_date(creation_date_raw)
        mod_dt = parse_pdf_date(mod_date_raw)
        
        creation_date = creation_dt.isoformat() if creation_dt else None
        modification_date = mod_dt.isoformat() if mod_dt else None
        
        is_modified_after_creation = False
        days_between = None
        
        if creation_dt and mod_dt:
            diff = (mod_dt - creation_dt).total_seconds()
            if diff > 60:
                is_modified_after_creation = True
            days_between = int(diff // 86400)
            
        return {
            "creator": str(creator) if creator else None,
            "producer": str(producer) if producer else None,
            "author": str(author) if author else None,
            "creation_date": creation_date,
            "modification_date": modification_date,
            "is_modified_after_creation": is_modified_after_creation,
            "days_between_creation_and_modification": days_between,
            "page_count": len(reader.pages),
            "is_encrypted": reader.is_encrypted,
            "raw_metadata": {str(k): str(v) for k, v in meta.items()}
        }
    except Exception:
        return {
            "creator": None,
            "producer": None,
            "author": None,
            "creation_date": None,
            "modification_date": None,
            "is_modified_after_creation": False,
            "days_between_creation_and_modification": None,
            "page_count": 0,
            "is_encrypted": False,
            "raw_metadata": {}
        }


def extract_font_info(file_bytes: bytes) -> dict:
    try:
        unique_fonts = set()
        fonts_per_page = []
        has_font_inconsistency = False
        inconsistent_pages = []
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                page_fonts = set()
                for char in page.chars:
                    fontname = char.get("fontname")
                    if fontname:
                        page_fonts.add(fontname)
                        unique_fonts.add(fontname)
                fonts_per_page.append(sorted(list(page_fonts)))
                if len(page_fonts) > 3:
                    has_font_inconsistency = True
                    inconsistent_pages.append(i + 1)
        
        unique_fonts = sorted(list(unique_fonts))
        font_count = len(unique_fonts)
        
        font_families = [
            ["Arial", "Helvetica", "Calibri"],
            ["Times", "Georgia"],
            ["Courier", "Mono"],
            ["Symbol", "Wingdings"]
        ]
        
        families_present = 0
        unique_fonts_lower = [f.lower() for f in unique_fonts]
        for family_group in font_families:
            for font in unique_fonts_lower:
                if any(fam.lower() in font for fam in family_group):
                    families_present += 1
                    break
                    
        suspicious_font_mixing = families_present >= 3
        
        return {
            "unique_fonts": unique_fonts,
            "font_count": font_count,
            "fonts_per_page": fonts_per_page,
            "has_font_inconsistency": has_font_inconsistency,
            "inconsistent_pages": inconsistent_pages,
            "suspicious_font_mixing": suspicious_font_mixing
        }
    except Exception:
        return {
            "unique_fonts": [],
            "font_count": 0,
            "fonts_per_page": [],
            "has_font_inconsistency": False,
            "inconsistent_pages": [],
            "suspicious_font_mixing": False
        }


def check_pdf_structure(file_bytes: bytes) -> dict:
    try:
        multiple_pdf_versions = file_bytes.count(b"%PDF-") > 1
        eof_count = file_bytes.count(b"%%EOF")
        incremental_updates_count = max(0, eof_count - 1)
        has_been_incrementally_updated = incremental_updates_count > 0
        
        has_javascript = b"/JS" in file_bytes or b"/JavaScript" in file_bytes
        has_embedded_files = b"/EmbeddedFiles" in file_bytes
        
        structural_anomaly_score = 0
        if has_been_incrementally_updated:
            structural_anomaly_score += 3
        if multiple_pdf_versions:
            structural_anomaly_score += 2
        if has_javascript:
            structural_anomaly_score += 3
        if has_embedded_files:
            structural_anomaly_score += 2
            
        structural_anomaly_score = min(10, structural_anomaly_score)
        
        return {
            "multiple_pdf_versions": multiple_pdf_versions,
            "incremental_updates_count": incremental_updates_count,
            "has_been_incrementally_updated": has_been_incrementally_updated,
            "has_javascript": has_javascript,
            "has_embedded_files": has_embedded_files,
            "structural_anomaly_score": structural_anomaly_score
        }
    except Exception:
        return {
            "multiple_pdf_versions": False,
            "incremental_updates_count": 0,
            "has_been_incrementally_updated": False,
            "has_javascript": False,
            "has_embedded_files": False,
            "structural_anomaly_score": 0
        }


def run_forensic_analysis(file_bytes: bytes, filename: str, doc_type: str) -> dict:
    metadata = extract_pdf_metadata(file_bytes)
    font_info = extract_font_info(file_bytes)
    structure = check_pdf_structure(file_bytes)
    
    score = 0
    if metadata.get("is_modified_after_creation"):
        score += 3
    if font_info.get("has_font_inconsistency"):
        score += 2
    if font_info.get("suspicious_font_mixing"):
        score += 2
    if structure.get("structural_anomaly_score", 0) >= 3:
        score += 3
        
    score = min(10, score)
    
    if score <= 2:
        risk_level = "LOW"
    elif score <= 5:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
        
    flags = []
    if metadata.get("is_modified_after_creation"):
        days = metadata.get("days_between_creation_and_modification")
        if days is not None and days > 0:
            flags.append(f"Document was modified {days} days after original creation")
        else:
            flags.append("Document was modified after original creation")
            
    if font_info.get("has_font_inconsistency") and font_info.get("inconsistent_pages"):
        pages = font_info["inconsistent_pages"]
        flags.append(f"Page {pages[0]} uses >3 different fonts — possible text replacement")
        
    if font_info.get("suspicious_font_mixing"):
        flags.append("Suspicious font mixing detected — copy-paste tampering likely")
        
    if structure.get("has_been_incrementally_updated"):
        updates = structure["incremental_updates_count"]
        flags.append(f"PDF contains {updates} incremental updates — document was edited after signing")
        
    if structure.get("multiple_pdf_versions"):
        flags.append("Multiple PDF versions found in file structure")
        
    if structure.get("has_javascript"):
        flags.append("Document contains hidden JavaScript")
        
    if structure.get("has_embedded_files"):
        flags.append("Document contains embedded files")
        
    return {
        "filename": filename,
        "doc_type": doc_type,
        "forensic_risk_score": score,
        "forensic_risk_level": risk_level,
        "forensic_flags": flags,
        "metadata": metadata,
        "font_analysis": font_info,
        "structure_analysis": structure
    }


def generate_forensic_insight_card(forensic_result: dict) -> dict | None:
    if forensic_result["forensic_risk_level"] == "LOW":
        return None
        
    flags_text = ". ".join(forensic_result["forensic_flags"])
    
    return {
        "pattern_id": "FP-FORENSIC-001",
        "pattern_name": "Document Structural Tampering",
        "affected_document": forensic_result["filename"],
        "failed_check": "PDF forensic analysis",
        "forensic_risk_level": forensic_result["forensic_risk_level"],
        "forensic_risk_score": forensic_result["forensic_risk_score"],
        "flags": forensic_result["forensic_flags"],
        "explanation": "Forensic analysis of the PDF structure reveals indicators of post-issuance modification. " + flags_text,
        "recommended_actions": [
            "Request the original document directly from the issuing authority",
            "Do not rely on this document for underwriting decisions until verified",
            "Compare document metadata with other documents in the same bundle",
            "Flag applicant ID for enhanced due diligence"
        ],
        "severity": "HIGH" if forensic_result["forensic_risk_level"] == "HIGH" else "MEDIUM"
    }

if __name__ == "__main__":
    print("Forensics engine loaded. Run against a PDF to test.")
