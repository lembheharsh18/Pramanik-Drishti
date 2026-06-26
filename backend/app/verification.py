import datetime
import io
import json
import time
import uuid
import zipfile
from collections import defaultdict

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.database import get_connection, init_db
from app.document_classifier import classify_from_zip
from app.hash_engine import (
    build_merkle_tree,
    compute_result_hash,
    compute_sha256,
    verify_bundle_seal,
    verify_document_hash,
)
from app.insight_engine import generate_insight_cards
from app.models import (
    BundleVerificationResponse,
    CheckStatus,
    DocumentVerificationResult,
    InsightCard,
    TemporalCheckResult,
)
from app.pdf_extractor import (
    extract_itr_data,
    extract_land_record_data,
    extract_salary_slip_data,
    extract_sale_deed_data,
    extract_text_from_pdf,
    extract_valuation_data,
    extract_property_tax_data,
    extract_bank_statement_data,
    extract_gst_returns_data,
    extract_business_registration_data,
)
from app.temporal_engine import run_all_temporal_checks
from app.forensics_engine import run_forensic_analysis, generate_forensic_insight_card


router = APIRouter(prefix="/verify", tags=["Verification"])

FIXED_DOCUMENT_ORDER = [
    ("land_record", "land_record"),
    ("salary_slip_1", "salary_slip"),
    ("salary_slip_2", "salary_slip"),
    ("salary_slip_3", "salary_slip"),
    ("itr", "itr"),
    ("valuation_report", "valuation_report"),
    ("sale_deed", "sale_deed"),
]

TEMPORAL_RULE_DOCUMENTS = {
    "TEMP-01": {"itr"},
    "TEMP-02": {"valuation_report"},
    "TEMP-03": {"sale_deed"},
    "TEMP-04": {"salary_slip_1", "salary_slip_2", "salary_slip_3"},
    "TEMP-05": {"itr", "salary_slip_1", "salary_slip_2", "salary_slip_3"},
    "TEMP-06": {"valuation_report"},
    "TEMP-07": {"sale_deed", "land_record"},
}

EXPECTED_VERIFICATION_SLOTS = {
    "home_loan": [
        "land_record",
        "salary_slip",
        "salary_slip",
        "salary_slip",
        "itr",
        "valuation_report",
        "sale_deed",
    ],
    "business_loan": [
        "business_registration",
        "gst_returns",
        "balance_sheet",
        "bank_statement",
        "ca_certificate",
    ],
    "land_mutation": [
        "mutation_application",
        "sale_deed",
        "property_tax_receipt",
        "noc",
        "identity_proof",
    ],
    "msme_loan": [
        "business_registration",
        "itr",
        "ca_financials",
        "gst_certificate",
        "bank_statement",
    ],
}

SLOT_CLASSIFICATION_ALIASES = {
    "ca_financials": {"balance_sheet", "ca_certificate"},
    "gst_certificate": {"gst_returns"},
}


@router.post("/bundle", response_model=BundleVerificationResponse)
async def verify_bundle(
    applicant_id: str = Form(...),
    bundle_id: str = Form(...),
    land_record: UploadFile = File(...),
    salary_slip_1: UploadFile = File(...),
    salary_slip_2: UploadFile = File(...),
    salary_slip_3: UploadFile = File(...),
    itr: UploadFile = File(...),
    valuation_report: UploadFile = File(...),
    sale_deed: UploadFile = File(...),
) -> BundleVerificationResponse:
    uploads = {
        "land_record": land_record,
        "salary_slip_1": salary_slip_1,
        "salary_slip_2": salary_slip_2,
        "salary_slip_3": salary_slip_3,
        "itr": itr,
        "valuation_report": valuation_report,
        "sale_deed": sale_deed,
    }
    files = {}
    for field_name, _doc_type in FIXED_DOCUMENT_ORDER:
        upload = uploads[field_name]
        files[field_name] = {
            "filename": upload.filename or field_name,
            "bytes": await upload.read(),
        }

    return verify_bundle_from_files(applicant_id, bundle_id, files)


@router.post("/bundle-zip")
async def verify_bundle_zip(
    applicant_id: str = Form(...),
    bundle_id: str = Form(...),
    verification_type: str = Form(...),
    zip_file: UploadFile = File(...),
) -> dict:
    zip_bytes = await zip_file.read()
    classified_documents = classify_from_zip(zip_bytes)
    extracted_files = _extract_pdf_files_from_zip(zip_bytes)

    if not classified_documents:
        raise HTTPException(status_code=400, detail="No PDF documents found in ZIP file.")

    classified_files = []
    for result in classified_documents:
        filename = result["filename"]
        classified_files.append(
            {
                "filename": filename,
                "bytes": extracted_files[filename],
                "detected_type": result["doc_type"],
                "confidence": result["confidence"],
                "score": result["score"],
                "duplicate_index": result.get("duplicate_index"),
            }
        )

    classification_summary = _build_classification_summary(
        classified_files,
        verification_type,
    )

    return verify_bundle_zip_from_classified_files(
        applicant_id=applicant_id,
        bundle_id=bundle_id,
        verification_type=verification_type,
        classified_files=classified_files,
        classification_summary=classification_summary,
    )


def verify_bundle_from_files(
    applicant_id: str,
    bundle_id: str,
    files: dict[str, dict],
) -> BundleVerificationResponse:
    init_db()
    start_time = time.time()
    verification_id = str(uuid.uuid4())
    application_date = datetime.date.today()

    stored_bundle = _fetch_bundle(bundle_id)
    stored_doc_ids = json.loads(stored_bundle["doc_ids"])
    stored_merkle_root = stored_bundle["merkle_root"]
    if len(stored_doc_ids) != len(FIXED_DOCUMENT_ORDER):
        raise HTTPException(
            status_code=400,
            detail="Stored bundle is invalid. Expected 7 registered documents.",
        )

    hash_results = []
    hash_failures = []
    uploaded_hashes = []

    for index, (field_name, doc_type) in enumerate(FIXED_DOCUMENT_ORDER):
        stored_doc = _fetch_registered_document(stored_doc_ids[index])
        filename = files[field_name]["filename"]
        uploaded_bytes = files[field_name]["bytes"]
        computed_hash = compute_sha256(uploaded_bytes)
        uploaded_hashes.append(computed_hash)
        is_valid, hash_detail = verify_document_hash(
            uploaded_bytes, stored_doc["sha256_hash"]
        )
        status = CheckStatus.PASS if is_valid else CheckStatus.FAIL

        result = {
            "field_name": field_name,
            "doc_id": stored_doc["doc_id"],
            "filename": filename,
            "doc_type": doc_type,
            "stored_hash": stored_doc["sha256_hash"],
            "computed_hash": computed_hash,
            "status": _status_value(status),
            "detail": hash_detail,
        }
        hash_results.append(result)

        if not is_valid:
            hash_failures.append(
                {
                    "filename": filename,
                    "doc_type": doc_type,
                    "detail": hash_detail,
                }
            )

    forensic_results = {}
    forensic_analysis_list = []
    forensic_flags_total = 0
    for field_name, doc_type in FIXED_DOCUMENT_ORDER:
        filename = files[field_name]["filename"]
        uploaded_bytes = files[field_name]["bytes"]
        f_result = run_forensic_analysis(uploaded_bytes, filename, doc_type)
        forensic_results[field_name] = f_result
        forensic_analysis_list.append(f_result)
        forensic_flags_total += len(f_result["forensic_flags"])

    extracted_text = {
        field_name: extract_text_from_pdf(files[field_name]["bytes"])
        for field_name, _doc_type in FIXED_DOCUMENT_ORDER
    }
    land_record_data = extract_land_record_data(extracted_text["land_record"])
    salary_slip_1_data = extract_salary_slip_data(extracted_text["salary_slip_1"])
    salary_slip_2_data = extract_salary_slip_data(extracted_text["salary_slip_2"])
    salary_slip_3_data = extract_salary_slip_data(extracted_text["salary_slip_3"])
    itr_data = extract_itr_data(extracted_text["itr"])
    valuation_data = extract_valuation_data(extracted_text["valuation_report"])
    sale_deed_data = extract_sale_deed_data(extracted_text["sale_deed"])
    extracted_metadata = {
        "land_record": land_record_data,
        "salary_slip_1": salary_slip_1_data,
        "salary_slip_2": salary_slip_2_data,
        "salary_slip_3": salary_slip_3_data,
        "itr": itr_data,
        "valuation_report": valuation_data,
        "sale_deed": sale_deed_data,
    }

    temporal_results = run_all_temporal_checks(
        itr_data=itr_data,
        salary_slips_data=[
            salary_slip_1_data,
            salary_slip_2_data,
            salary_slip_3_data,
        ],
        valuation_data=valuation_data,
        sale_deed_data=sale_deed_data,
        land_record_data=land_record_data,
        application_date=application_date,
    )

    computed_merkle_root = build_merkle_tree(uploaded_hashes)
    bundle_seal_valid, bundle_seal_detail = verify_bundle_seal(
        uploaded_hashes, stored_merkle_root
    )
    bundle_seal_status = CheckStatus.PASS if bundle_seal_valid else CheckStatus.FAIL

    insight_cards = generate_insight_cards(
        bundle_id=bundle_id,
        hash_failures=hash_failures,
        bundle_seal_failed=not bundle_seal_valid,
        temporal_results=temporal_results,
    )
    
    for f_result in forensic_analysis_list:
        card = generate_forensic_insight_card(f_result)
        if card:
            card["card_id"] = str(uuid.uuid4())
            card["bundle_id"] = bundle_id
            card["generated_at"] = datetime.datetime.utcnow().isoformat()
            
            card_data_for_hash = {
                "card_id": card["card_id"],
                "bundle_id": card["bundle_id"],
                "fraud_pattern": {
                    "pattern_id": card["pattern_id"],
                    "pattern_name": card["pattern_name"],
                    "affected_document": card["affected_document"],
                    "failed_check": card["failed_check"],
                    "explanation": card["explanation"],
                    "recommended_actions": card["recommended_actions"],
                    "severity": card["severity"]
                },
                "generated_at": card["generated_at"]
            }
            card["result_hash"] = compute_result_hash(card_data_for_hash)
            
            fp = {
                "pattern_id": card["pattern_id"],
                "pattern_name": card["pattern_name"],
                "affected_document": card["affected_document"],
                "failed_check": card["failed_check"],
                "explanation": card["explanation"],
                "recommended_actions": card["recommended_actions"],
                "severity": card["severity"]
            }
            insight_cards.append(InsightCard(
                card_id=card["card_id"],
                bundle_id=card["bundle_id"],
                fraud_pattern=fp,
                generated_at=card["generated_at"],
                result_hash=card["result_hash"]
            ))

    _write_audit_logs(
        bundle_id=bundle_id,
        applicant_id=applicant_id,
        verification_id=verification_id,
        hash_results=hash_results,
        temporal_results=temporal_results,
        bundle_status=bundle_seal_status,
        bundle_detail={
            "stored_merkle_root": stored_merkle_root,
            "computed_merkle_root": computed_merkle_root,
            "detail": bundle_seal_detail,
        },
        insight_cards=insight_cards,
    )

    document_results = _build_document_results(
        hash_results,
        temporal_results,
        extracted_metadata,
        forensic_results,
    )
    verification_time = time.time() - start_time

    return BundleVerificationResponse(
        bundle_id=bundle_id,
        applicant_id=applicant_id,
        total_documents=len(document_results),
        bundle_seal_status=bundle_seal_status,
        bundle_seal_detail=bundle_seal_detail,
        document_results=document_results,
        insight_cards=insight_cards,
        forensic_analysis=forensic_analysis_list,
        forensic_flags_total=forensic_flags_total,
        verification_time_seconds=verification_time,
        verified_at=datetime.datetime.utcnow().isoformat(),
    )


def verify_bundle_zip_from_classified_files(
    applicant_id: str,
    bundle_id: str,
    verification_type: str,
    classified_files: list[dict],
    classification_summary: list[dict],
) -> dict:
    init_db()
    start_time = time.time()
    verification_id = str(uuid.uuid4())
    application_date = datetime.date.today()

    stored_bundle = _fetch_bundle(bundle_id)
    stored_doc_ids = json.loads(stored_bundle["doc_ids"])
    stored_docs = [_fetch_registered_document(doc_id) for doc_id in stored_doc_ids]
    stored_docs_by_type = defaultdict(list)
    for stored_doc in stored_docs:
        stored_docs_by_type[stored_doc["doc_type"]].append(stored_doc)

    salary_slip_index = 0
    hash_results = []
    hash_failures = []
    uploaded_hashes_by_doc_id = {}
    extracted_metadata = {}
    salary_slips_data = []
    itr_data = {}
    land_record_data = {}
    valuation_data = {}
    sale_deed_data = {}
    forensic_results = {}
    forensic_analysis_list = []
    forensic_flags_total = 0

    for index, file_data in enumerate(classified_files):
        detected_type = file_data["detected_type"]
        matched_slot = classification_summary[index]["matched_slot"]
        stored_doc = _pop_stored_document_for_type(
            stored_docs_by_type,
            detected_type,
            matched_slot,
        )
        filename = file_data["filename"]
        uploaded_bytes = file_data["bytes"]
        computed_hash = compute_sha256(uploaded_bytes)

        if detected_type == "salary_slip":
            salary_slip_index += 1
            field_name = f"salary_slip_{salary_slip_index}"
        else:
            field_name = detected_type

        if stored_doc is None:
            status = CheckStatus.FAIL
            detail = f"No registered document found for detected type '{detected_type}'."
            stored_hash = ""
            doc_id = ""
        else:
            doc_id = stored_doc["doc_id"]
            stored_hash = stored_doc["sha256_hash"]
            is_valid, detail = verify_document_hash(uploaded_bytes, stored_hash)
            status = CheckStatus.PASS if is_valid else CheckStatus.FAIL
            uploaded_hashes_by_doc_id[doc_id] = computed_hash

        hash_result = {
            "field_name": field_name,
            "doc_id": doc_id,
            "filename": filename,
            "doc_type": detected_type,
            "stored_hash": stored_hash,
            "computed_hash": computed_hash,
            "status": _status_value(status),
            "detail": detail,
            "classification_confidence": file_data["confidence"],
            "matched_slot": matched_slot,
        }
        hash_results.append(hash_result)

        if status == CheckStatus.FAIL:
            hash_failures.append(
                {
                    "filename": filename,
                    "doc_type": detected_type,
                    "detail": detail,
                }
            )

        metadata = _extract_metadata_for_doc_type(detected_type, uploaded_bytes)
        extracted_metadata[field_name] = metadata
        
        f_result = run_forensic_analysis(uploaded_bytes, filename, detected_type)
        forensic_results[field_name] = f_result
        forensic_analysis_list.append(f_result)
        forensic_flags_total += len(f_result["forensic_flags"])
        
        if detected_type == "salary_slip":
            salary_slips_data.append(metadata)
        elif detected_type == "itr":
            itr_data = metadata
        elif detected_type == "land_record":
            land_record_data = metadata
        elif detected_type == "valuation_report":
            valuation_data = metadata
        elif detected_type == "sale_deed":
            sale_deed_data = metadata

    temporal_results = run_all_temporal_checks(
        itr_data=itr_data,
        salary_slips_data=salary_slips_data,
        valuation_data=valuation_data,
        sale_deed_data=sale_deed_data,
        land_record_data=land_record_data,
        application_date=application_date,
    )

    submitted_hashes = [
        uploaded_hashes_by_doc_id[stored_doc["doc_id"]]
        for stored_doc in stored_docs
        if stored_doc["doc_id"] in uploaded_hashes_by_doc_id
    ]
    computed_merkle_root = build_merkle_tree(submitted_hashes)
    bundle_seal_valid, bundle_seal_detail = verify_bundle_seal(
        submitted_hashes,
        stored_bundle["merkle_root"],
    )
    if len(submitted_hashes) != len(stored_docs):
        bundle_seal_valid = False
        bundle_seal_detail = (
            "Bundle seal broken - expected "
            f"{len(stored_docs)} registered documents but matched {len(submitted_hashes)}."
        )
    bundle_seal_status = CheckStatus.PASS if bundle_seal_valid else CheckStatus.FAIL

    insight_cards = generate_insight_cards(
        bundle_id=bundle_id,
        hash_failures=hash_failures,
        bundle_seal_failed=not bundle_seal_valid,
        temporal_results=temporal_results,
    )

    _write_audit_logs(
        bundle_id=bundle_id,
        applicant_id=applicant_id,
        verification_id=verification_id,
        hash_results=hash_results,
        temporal_results=temporal_results,
        bundle_status=bundle_seal_status,
        bundle_detail={
            "stored_merkle_root": stored_bundle["merkle_root"],
            "computed_merkle_root": computed_merkle_root,
            "detail": bundle_seal_detail,
            "classification_summary": classification_summary,
        },
        insight_cards=insight_cards,
    )

    document_results = _build_document_results(
        hash_results,
        temporal_results,
        extracted_metadata,
        forensic_results,
    )
    verification_time = time.time() - start_time

    return {
        "bundle_id": bundle_id,
        "applicant_id": applicant_id,
        "verification_type": verification_type,
        "classification_summary": classification_summary,
        "total_documents_found": len(classified_files),
        "total_documents_expected": len(EXPECTED_VERIFICATION_SLOTS.get(verification_type, [])),
        "bundle_seal_status": _status_value(bundle_seal_status),
        "bundle_seal_detail": bundle_seal_detail,
        "document_results": document_results,
        "insight_cards": insight_cards,
        "forensic_analysis": forensic_analysis_list,
        "forensic_flags_total": forensic_flags_total,
        "verification_time_seconds": verification_time,
        "verified_at": datetime.datetime.utcnow().isoformat(),
    }


@router.get("/audit-log/{bundle_id}")
def get_audit_log(bundle_id: str) -> list[dict]:
    init_db()
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT event_type, document_name, status, detail, result_hash, created_at
            FROM audit_log
            WHERE bundle_id = ?
            ORDER BY id ASC
            """,
            (bundle_id,),
        ).fetchall()

    return [
        {
            "event_type": row["event_type"],
            "document_name": row["document_name"],
            "status": row["status"],
            "detail": _loads_json(row["detail"]),
            "result_hash": row["result_hash"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def _fetch_bundle(bundle_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM bundles WHERE bundle_id = ?",
            (bundle_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Bundle not found. Register documents first.",
        )
    return row


def _fetch_registered_document(doc_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM document_registry WHERE doc_id = ?",
            (doc_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Registered document not found for doc_id {doc_id}.",
        )
    return row


def _write_audit_logs(
    bundle_id: str,
    applicant_id: str,
    verification_id: str,
    hash_results: list[dict],
    temporal_results: list[TemporalCheckResult],
    bundle_status: CheckStatus,
    bundle_detail: dict,
    insight_cards: list[InsightCard],
) -> None:
    created_at = datetime.datetime.utcnow().isoformat()
    audit_rows = []

    for hash_result in hash_results:
        detail = {
            "verification_id": verification_id,
            "doc_id": hash_result["doc_id"],
            "filename": hash_result["filename"],
            "doc_type": hash_result["doc_type"],
            "stored_hash": hash_result["stored_hash"],
            "computed_hash": hash_result["computed_hash"],
            "detail": hash_result["detail"],
        }
        audit_rows.append(
            (
                "HASH_CHECK",
                hash_result["filename"],
                hash_result["status"],
                detail,
            )
        )

    for temporal_result in temporal_results:
        detail = {
            "verification_id": verification_id,
            **temporal_result.model_dump(),
        }
        audit_rows.append(
            (
                "TEMPORAL_CHECK",
                temporal_result.rule_name,
                _status_value(temporal_result.status),
                detail,
            )
        )

    audit_rows.append(
        (
            "BUNDLE_CHECK",
            "Full application bundle",
            _status_value(bundle_status),
            {
                "verification_id": verification_id,
                **bundle_detail,
            },
        )
    )

    for insight_card in insight_cards:
        detail = {
            "verification_id": verification_id,
            **insight_card.model_dump(),
        }
        audit_rows.append(
            (
                "INSIGHT_CARD_GENERATED",
                insight_card.fraud_pattern.affected_document,
                CheckStatus.FAIL.value,
                detail,
            )
        )

    with get_connection() as connection:
        for event_type, document_name, status, detail in audit_rows:
            detail_json = json.dumps(detail, sort_keys=True)
            connection.execute(
                """
                INSERT INTO audit_log (
                    bundle_id, applicant_id, event_type, document_name, status,
                    detail, result_hash, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    bundle_id,
                    applicant_id,
                    event_type,
                    document_name,
                    status,
                    detail_json,
                    compute_result_hash(detail),
                    created_at,
                ),
            )
        connection.commit()


def _build_document_results(
    hash_results: list[dict],
    temporal_results: list[TemporalCheckResult],
    extracted_metadata: dict[str, dict],
    forensic_results: dict[str, dict] = None,
) -> list[DocumentVerificationResult]:
    if forensic_results is None:
        forensic_results = {}
        
    results = []

    for hash_result in hash_results:
        field_name = hash_result["field_name"]
        related_temporal_checks = [
            temporal_result
            for temporal_result in temporal_results
            if field_name in TEMPORAL_RULE_DOCUMENTS.get(temporal_result.rule_id, set())
        ]
        has_fraud = hash_result["status"] == CheckStatus.FAIL.value or any(
            _status_value(check.status) == CheckStatus.FAIL.value
            for check in related_temporal_checks
        )
        
        f_res = forensic_results.get(field_name, {})

        results.append(
            DocumentVerificationResult(
                doc_id=hash_result["doc_id"],
                filename=hash_result["filename"],
                doc_type=hash_result["doc_type"],
                metadata=extracted_metadata.get(field_name, {}),
                hash_status=hash_result["status"],
                hash_detail=hash_result["detail"],
                temporal_checks=related_temporal_checks,
                has_fraud=has_fraud,
                forensic_risk_level=f_res.get("forensic_risk_level", "LOW"),
                forensic_risk_score=f_res.get("forensic_risk_score", 0),
                forensic_flags=f_res.get("forensic_flags", []),
            )
        )

    return results


def _status_value(status: CheckStatus | str) -> str:
    if isinstance(status, CheckStatus):
        return status.value
    return str(status)


def _loads_json(value: str | None):
    if value is None:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def _extract_pdf_files_from_zip(zip_bytes: bytes) -> dict[str, bytes]:
    files = {}
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
            for member in archive.infolist():
                filename = member.filename
                normalized_filename = filename.replace("\\", "/")

                if member.is_dir() or normalized_filename.startswith("__MACOSX/"):
                    continue

                if not normalized_filename.lower().endswith(".pdf"):
                    continue

                files[filename] = archive.read(member)
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid ZIP.") from exc

    return files


def _build_classification_summary(
    classified_files: list[dict],
    verification_type: str,
) -> list[dict]:
    remaining_slots = EXPECTED_VERIFICATION_SLOTS.get(verification_type, [])[:]
    summary = []

    for file_data in classified_files:
        matched_slot = _pop_matching_slot(remaining_slots, file_data["detected_type"])
        item = {
            "filename": file_data["filename"],
            "detected_type": file_data["detected_type"],
            "confidence": file_data["confidence"],
            "matched_slot": matched_slot,
        }
        if file_data["confidence"] == "low" or file_data["detected_type"] == "unknown":
            item["warning"] = "Document type could not be confidently identified."
        summary.append(item)

    return summary


def _pop_matching_slot(slots: list[str], detected_type: str) -> str | None:
    for index, slot in enumerate(slots):
        if _slot_matches_detected_type(slot, detected_type):
            return slots.pop(index)
    return None


def _slot_matches_detected_type(slot: str, detected_type: str) -> bool:
    if slot == detected_type:
        return True
    return detected_type in SLOT_CLASSIFICATION_ALIASES.get(slot, set())


def _pop_stored_document_for_type(
    stored_docs_by_type: dict[str, list],
    detected_type: str,
    matched_slot: str | None,
):
    if stored_docs_by_type.get(detected_type):
        return stored_docs_by_type[detected_type].pop(0)

    if matched_slot:
        for stored_type, stored_docs in stored_docs_by_type.items():
            if stored_docs and _slot_matches_detected_type(matched_slot, stored_type):
                return stored_docs.pop(0)

    return None


def _extract_metadata_for_doc_type(doc_type: str, file_bytes: bytes) -> dict:
    full_text = extract_text_from_pdf(file_bytes)
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
    if doc_type == "property_tax_receipt":
        return extract_property_tax_data(full_text)
    if doc_type == "bank_statement":
        return extract_bank_statement_data(full_text)
    if doc_type == "gst_returns":
        return extract_gst_returns_data(full_text)
    if doc_type == "business_registration":
        return extract_business_registration_data(full_text)
    return {}
