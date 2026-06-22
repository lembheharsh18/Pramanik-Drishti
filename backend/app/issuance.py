import datetime
import json
import uuid

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile

from app.database import get_connection, init_db
from app.hash_engine import build_merkle_tree, compute_sha256
from app.pdf_extractor import (
    extract_itr_data,
    extract_land_record_data,
    extract_salary_slip_data,
    extract_sale_deed_data,
    extract_text_from_pdf,
    extract_valuation_data,
)


router = APIRouter(prefix="/issuance", tags=["Document Issuance"])

VALID_DOCUMENT_TYPES = {
    "land_record",
    "salary_slip",
    "itr",
    "valuation_report",
    "sale_deed",
}

BUNDLE_DOCUMENTS = [
    ("land_record", "land_record"),
    ("salary_slip_1", "salary_slip"),
    ("salary_slip_2", "salary_slip"),
    ("salary_slip_3", "salary_slip"),
    ("itr", "itr"),
    ("valuation_report", "valuation_report"),
    ("sale_deed", "sale_deed"),
]


@router.post("/register-document")
async def register_document(
    doc_type: str = Form(...),
    applicant_id: str = Form(...),
    file: UploadFile = File(...),
) -> dict:
    init_db()
    if doc_type not in VALID_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid document type")

    file_bytes = await file.read()
    issued_at = datetime.datetime.utcnow().isoformat()
    document = _process_document(file.filename or "uploaded.pdf", doc_type, file_bytes)
    doc_id = str(uuid.uuid4())

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO document_registry (
                doc_id, filename, doc_type, sha256_hash, applicant_id, issued_at,
                metadata
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doc_id,
                document["filename"],
                doc_type,
                document["sha256_hash"],
                applicant_id,
                issued_at,
                json.dumps(document["metadata"], sort_keys=True),
            ),
        )
        connection.commit()

    return {
        "doc_id": doc_id,
        "filename": document["filename"],
        "doc_type": doc_type,
        "applicant_id": applicant_id,
        "sha256_hash": document["sha256_hash"],
        "issued_at": issued_at,
        "metadata": document["metadata"],
        "message": "Document registered successfully. Hash stored for verification.",
    }


@router.post("/register-bundle")
async def register_bundle(
    applicant_id: str = Form(...),
    land_record: UploadFile = File(...),
    salary_slip_1: UploadFile = File(...),
    salary_slip_2: UploadFile = File(...),
    salary_slip_3: UploadFile = File(...),
    itr: UploadFile = File(...),
    valuation_report: UploadFile = File(...),
    sale_deed: UploadFile = File(...),
) -> dict:
    uploaded_files = {
        "land_record": land_record,
        "salary_slip_1": salary_slip_1,
        "salary_slip_2": salary_slip_2,
        "salary_slip_3": salary_slip_3,
        "itr": itr,
        "valuation_report": valuation_report,
        "sale_deed": sale_deed,
    }
    files = {}
    for field_name, doc_type in BUNDLE_DOCUMENTS:
        upload = uploaded_files[field_name]
        files[field_name] = {
            "filename": upload.filename or field_name,
            "bytes": await upload.read(),
        }

    return register_bundle_from_files(applicant_id, files)


def register_bundle_from_files(applicant_id: str, files: dict[str, dict]) -> dict:
    init_db()
    registered_documents = []
    created_at = datetime.datetime.utcnow().isoformat()

    for field_name, doc_type in BUNDLE_DOCUMENTS:
        file_data = files[field_name]
        document = _process_document(
            file_data["filename"],
            doc_type,
            file_data["bytes"],
        )
        registered_documents.append(
            {
                "doc_id": str(uuid.uuid4()),
                "doc_type": doc_type,
                "issued_at": created_at,
                **document,
            }
        )

    document_hashes = [document["sha256_hash"] for document in registered_documents]
    merkle_root = build_merkle_tree(document_hashes)
    bundle_id = str(uuid.uuid4())
    doc_ids = [document["doc_id"] for document in registered_documents]

    with get_connection() as connection:
        for document in registered_documents:
            connection.execute(
                """
                INSERT INTO document_registry (
                    doc_id, filename, doc_type, sha256_hash, applicant_id,
                    issued_at, metadata
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document["doc_id"],
                    document["filename"],
                    document["doc_type"],
                    document["sha256_hash"],
                    applicant_id,
                    document["issued_at"],
                    json.dumps(document["metadata"], sort_keys=True),
                ),
            )

        connection.execute(
            """
            INSERT INTO bundles (
                bundle_id, applicant_id, merkle_root, doc_ids, created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                bundle_id,
                applicant_id,
                merkle_root,
                json.dumps(doc_ids),
                created_at,
            ),
        )
        connection.commit()

    return {
        "bundle_id": bundle_id,
        "applicant_id": applicant_id,
        "merkle_root": merkle_root,
        "documents_registered": 7,
        "doc_ids": doc_ids,
        "message": "Bundle registered and sealed. Merkle root stored.",
    }


def _process_document(filename: str, doc_type: str, file_bytes: bytes) -> dict:
    sha256_hash = compute_sha256(file_bytes)
    full_text = extract_text_from_pdf(file_bytes)
    metadata = _extract_metadata(doc_type, full_text)

    return {
        "filename": filename,
        "sha256_hash": sha256_hash,
        "metadata": metadata,
    }


def _extract_metadata(doc_type: str, full_text: str) -> dict:
    if doc_type == "land_record":
        return extract_land_record_data(full_text)
    if doc_type == "salary_slip":
        return extract_salary_slip_data(full_text)
    if doc_type == "itr":
        return extract_itr_data(full_text)
    if doc_type == "valuation_report":
        return extract_valuation_data(full_text)
    if doc_type == "sale_deed":
        return extract_sale_deed_data(full_text)
    return {}


_ = FastAPI
