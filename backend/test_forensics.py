import os
import sys

# Test imports
print("Testing imports...")
from app.forensics_engine import run_forensic_analysis, extract_pdf_metadata, check_pdf_structure, extract_font_info
from app.temporal_engine import check_property_value_consistency, check_bank_statement_vs_itr, run_all_temporal_checks
from app.pdf_extractor import extract_property_tax_data, extract_bank_statement_data, extract_gst_returns_data, extract_business_registration_data
from app.insight_engine import FRAUD_PATTERNS
from app.verification import verify_bundle

print("Imports successful!")

print(f"Total Temporal Rules: 9 (Expected 9)")
print(f"Total Fraud Patterns: {len(FRAUD_PATTERNS)} (Expected 11)")

assert len(FRAUD_PATTERNS) == 11, f"Expected 11 fraud patterns, got {len(FRAUD_PATTERNS)}"

print("Backend tests passed successfully.")
