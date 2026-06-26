import json
import os
from pathlib import Path

from app.database import init_db
from app.demo import CLEAN_FILES, FRAUD_FILES, SAMPLE_DIR
from app.issuance import register_bundle_from_files


BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BACKEND_DIR / "pramanik.db"
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


def main() -> None:
    os.chdir(BACKEND_DIR)

    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()

    init_db()

    clean_registration = register_bundle_from_files(
        "DEMO-APPLICANT-001",
        load_sample_files(CLEAN_FILES),
    )
    fraud_registration = register_bundle_from_files(
        "DEMO-APPLICANT-001",
        load_sample_files(FRAUD_FILES),
    )

    bundle_ids = {
        "clean": clean_registration["bundle_id"],
        "fraud": fraud_registration["bundle_id"],
        "demo_bundle_id": fraud_registration["bundle_id"],
    }
    BUNDLE_IDS_PATH.write_text(json.dumps(bundle_ids, indent=2), encoding="utf-8")

    print("Demo reset complete.")
    print(f"Bundle A (clean) ID: {bundle_ids['clean']}")
    print(f"Bundle B (fraud) ID: {bundle_ids['fraud']}")
    print("Copy Bundle B ID to test fraud detection.")


if __name__ == "__main__":
    main()
