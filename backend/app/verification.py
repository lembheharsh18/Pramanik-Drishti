import datetime
import json
import time
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.database import get_connection, init_db
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
)
from app.temporal_engine import run_all_temporal_checks


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
        verification_time_seconds=verification_time,
        verified_at=datetime.datetime.utcnow().isoformat(),
    )


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
) -> list[DocumentVerificationResult]:
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
