import json
import os
from pathlib import Path

from app.demo import CLEAN_FILES, FRAUD_FILES, SAMPLE_DIR
from app.issuance import register_bundle_from_files
from app.verification import verify_bundle_from_files


BACKEND_DIR = Path(__file__).parent
BUNDLE_IDS_PATH = BACKEND_DIR / "bundle_ids.json"


def load_sample_files(file_map: dict[str, str]) -> dict[str, dict]:
    files = {}
    for field_name, filename in file_map.items():
        path = SAMPLE_DIR / filename
        files[field_name] = {
            "filename": filename,
            "bytes": path.read_bytes(),
        }
    return files


def register_bundle(applicant_id: str, file_map: dict[str, str]) -> dict:
    return register_bundle_from_files(applicant_id, load_sample_files(file_map))


def verify_bundle(applicant_id: str, bundle_id: str, file_map: dict[str, str]) -> dict:
    result = verify_bundle_from_files(
        applicant_id,
        bundle_id,
        load_sample_files(file_map),
    )
    return result.model_dump()


def main() -> None:
    os.chdir(BACKEND_DIR)

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
        "demo_bundle_id": fraud_registration["bundle_id"],
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
