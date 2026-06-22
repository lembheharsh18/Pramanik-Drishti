# PRAMANIK-DRISHTI

PRAMANIK means authentic, and DRISHTI means vision. Together, PRAMANIK-DRISHTI is an "Authentic Vision" prototype: a document verification and underwriting insight system that checks whether documents still match their issued cryptographic hashes, whether their dates and values are logically possible, and why any detected fraud matters.

## Description

PRAMANIK-DRISHTI is a full-stack FastAPI + React prototype for the Canara Bank SuRaksha Hackathon. The backend registers document bundles, stores SHA-256 hashes, seals bundles with a Merkle root, runs seven temporal fraud rules, writes a tamper-evident audit log, and generates DRISHTI Insight Cards. The frontend lets an underwriter register bundles, verify uploaded documents, inspect fraud patterns, and view immutable audit entries.

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Setup

```powershell
cd backend
pip install -r requirements.txt
pip install reportlab requests pytest
python create_sample_docs.py
python run.py
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`

## Demo Flow

1. Start the backend with `cd backend && python run.py`.
2. Start the frontend with `cd frontend && npm run dev`.
3. Generate PDFs with `cd backend && python create_sample_docs.py`.
4. Run `python demo_setup.py` from `backend` to register and verify the clean and fraudulent bundles through the API.
5. In the browser, go to `http://localhost:5173/register`.
6. Register Bundle A using the clean PDFs in `backend/sample_docs` and applicant ID `APP-CLEAN-002`.
7. Copy the returned Bundle ID.
8. Go to `/verify`, enter the Bundle ID, upload the same clean files, and confirm zero fraud signals.
9. Register Bundle B using the fraudulent PDFs and applicant ID `APP-FRAUD-002`.
10. Verify Bundle B and inspect the red DRISHTI Insight Cards.

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | API health and metadata |
| POST | `/issuance/register-document` | Register one document hash and extracted metadata |
| POST | `/issuance/register-bundle` | Register seven documents and store a Merkle bundle seal |
| POST | `/verify/bundle` | Verify hashes, temporal rules, bundle seal, and generate insight cards |
| GET | `/verify/audit-log/{bundle_id}` | Fetch immutable audit log entries for a bundle |
| GET | `/docs` | Swagger API documentation |

## Fraud Patterns

| Pattern ID | Name | Document | Rule |
| --- | --- | --- | --- |
| FP-001 | Direct Document Tampering | Any document | HASH_FAIL |
| FP-002 | Identity Bundle Swap | Full application bundle | BUNDLE_FAIL |
| FP-003 | Backdated ITR Fraud | Income Tax Return | TEMP-01 |
| FP-004 | Post-Sanction Valuation Backdating | Property Valuation Report | TEMP-02 |
| FP-005 | Holiday Registration Fraud | Sale Deed | TEMP-03 |
| FP-006 | Non-Sequential Salary Slip Submission | Salary Slips | TEMP-04 |
| FP-007 | Income Inflation Across Documents | Salary Slip and Income Tax Return | TEMP-05 |
| FP-008 | Stale Valuation Report | Property Valuation Report | TEMP-06 |
| FP-009 | Seller-Owner Identity Mismatch | Sale Deed and Land Record | TEMP-07 |

## Screenshots

Add screenshots here:

- Dashboard
- Register bundle
- Verification results
- DRISHTI Insight Cards
- Immutable audit log
"# Pramanik-Drishti" 
