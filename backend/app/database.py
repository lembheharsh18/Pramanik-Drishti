import os
import sqlite3
from pathlib import Path


DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "pramanik.db"))


def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(DATABASE_PATH))
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS document_registry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                sha256_hash TEXT NOT NULL,
                applicant_id TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                metadata TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bundle_id TEXT NOT NULL,
                applicant_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                document_name TEXT,
                status TEXT NOT NULL,
                detail TEXT,
                result_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS bundles (
                bundle_id TEXT PRIMARY KEY,
                applicant_id TEXT,
                merkle_root TEXT,
                doc_ids TEXT,
                created_at TEXT
            )
            """
        )
        connection.commit()
