import json
from pathlib import Path

import requests


BASE_URL = "http://127.0.0.1:8000"
BACKEND_DIR = Path(__file__).parent
SAMPLE_DIR = BACKEND_DIR / "sample_docs"
BUNDLE_IDS_PATH = BACKEND_DIR / "bundle_ids.json"

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


def register_bundle(applicant_id: str, file_map: dict[str, str]) -> dict:
    with open_files(file_map) as files:
        response = requests.post(
            f"{BASE_URL}/issuance/register-bundle",
            data={"applicant_id": applicant_id},
            files=files,
            timeout=60,
        )
    response.raise_for_status()
    return response.json()


def verify_bundle(applicant_id: str, bundle_id: str, file_map: dict[str, str]) -> dict:
    with open_files(file_map) as files:
        response = requests.post(
            f"{BASE_URL}/verify/bundle",
            data={"applicant_id": applicant_id, "bundle_id": bundle_id},
            files=files,
            timeout=60,
        )
    response.raise_for_status()
    return response.json()


class open_files:
    def __init__(self, file_map: dict[str, str]):
        self.file_map = file_map
        self.handles = []

    def __enter__(self):
        upload_files = {}
        for field_name, filename in self.file_map.items():
            path = SAMPLE_DIR / filename
            handle = path.open("rb")
            self.handles.append(handle)
            upload_files[field_name] = (filename, handle, "application/pdf")
        return upload_files

    def __exit__(self, exc_type, exc_value, traceback):
        for handle in self.handles:
            handle.close()


def main() -> None:
    print("Registering Bundle A (clean)...")
    clean_registration = register_bundle("APP-CLEAN-001", CLEAN_FILES)
    print(f"Clean bundle_id: {clean_registration['bundle_id']}")
    print(f"Clean merkle_root: {clean_registration['merkle_root']}")

    print("Registering Bundle B (fraudulent)...")
    fraud_registration = register_bundle("APP-FRAUD-001", FRAUD_FILES)
    print(f"Fraud bundle_id: {fraud_registration['bundle_id']}")
    print(f"Fraud merkle_root: {fraud_registration['merkle_root']}")

    bundle_ids = {
        "clean": clean_registration["bundle_id"],
        "fraud": fraud_registration["bundle_id"],
    }
    BUNDLE_IDS_PATH.write_text(json.dumps(bundle_ids, indent=2), encoding="utf-8")
    print(f"Saved bundle IDs to {BUNDLE_IDS_PATH}")

    print("Verifying Bundle A (clean)...")
    clean_result = verify_bundle("APP-CLEAN-001", bundle_ids["clean"], CLEAN_FILES)
    clean_insight_count = len(clean_result["insight_cards"])
    print(f"Clean insight cards: {clean_insight_count}")
    print(f"Clean bundle seal status: {clean_result['bundle_seal_status']}")
    assert clean_insight_count == 0
    assert clean_result["bundle_seal_status"] == "PASS"

    print("Verifying Bundle B (fraudulent)...")
    fraud_result = verify_bundle("APP-FRAUD-001", bundle_ids["fraud"], FRAUD_FILES)
    pattern_names = [
        card["fraud_pattern"]["pattern_name"] for card in fraud_result["insight_cards"]
    ]
    print(f"Fraud insight cards: {len(pattern_names)}")
    print("Detected patterns:")
    for pattern_name in pattern_names:
        print(f"  - {pattern_name}")

    assert len(pattern_names) > 0
    assert "Backdated ITR Fraud" in pattern_names
    assert "Holiday Registration Fraud" in pattern_names

    print("Demo setup and verification completed successfully.")


if __name__ == "__main__":
    main()
