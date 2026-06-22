import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.issuance import register_bundle_from_files
from app.verification import verify_bundle_from_files


router = APIRouter(prefix="/demo", tags=["Demo"])

SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_docs"

CLEAN_FILES = {
    "land_record": "land_record_clean.pdf",
    "salary_slip_1": "salary_slip_jan_clean.pdf",
    "salary_slip_2": "salary_slip_feb_clean.pdf",
    "salary_slip_3": "salary_slip_mar_clean.pdf",
    "itr": "itr_clean.pdf",
    "valuation_report": "valuation_report_clean.pdf",
    "sale_deed": "sale_deed_clean.pdf",
}

FRAUD_FILES = {
    "land_record": "land_record_fraud.pdf",
    "salary_slip_1": "salary_slip_jan_fraud.pdf",
    "salary_slip_2": "salary_slip_feb_fraud.pdf",
    "salary_slip_3": "salary_slip_apr_fraud.pdf",
    "itr": "itr_fraud.pdf",
    "valuation_report": "valuation_report_fraud.pdf",
    "sale_deed": "sale_deed_fraud.pdf",
}


@router.post("/run-clean")
def run_clean_demo() -> dict:
    return _run_demo("clean", "APP-CLEAN-DEMO", CLEAN_FILES)


@router.post("/run-fraud")
def run_fraud_demo() -> dict:
    return _run_demo("fraud", "APP-FRAUD-DEMO", FRAUD_FILES)


def _run_demo(label: str, applicant_prefix: str, file_map: dict[str, str]) -> dict:
    files = _load_sample_files(file_map)
    applicant_id = f"{applicant_prefix}-{datetime.datetime.utcnow().strftime('%H%M%S')}"
    registration = register_bundle_from_files(applicant_id, files)
    verification = verify_bundle_from_files(
        applicant_id,
        registration["bundle_id"],
        files,
    )

    return {
        "demo_type": label,
        "registration": registration,
        "verification": verification.model_dump(),
    }


def _load_sample_files(file_map: dict[str, str]) -> dict[str, dict]:
    files = {}
    missing_files = []

    for field_name, filename in file_map.items():
        path = SAMPLE_DIR / filename
        if not path.exists():
            missing_files.append(filename)
            continue
        files[field_name] = {
            "filename": filename,
            "bytes": path.read_bytes(),
        }

    if missing_files:
        raise HTTPException(
            status_code=500,
            detail=f"Missing sample documents: {', '.join(missing_files)}",
        )

    return files
