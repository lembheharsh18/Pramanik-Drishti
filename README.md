<![CDATA[<div align="center">

# 🛡️ PRAMANIK-DRISHTI

### _Authentic Vision — The document that sees its own truth_

**Real-Time Forgery Detection & Intelligent Underwriting Insights**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📖 About

**PRAMANIK** (प्रामाणिक) means _authentic_, and **DRISHTI** (दृष्टि) means _vision_.

Pramanik-Drishti is a full-stack document verification and underwriting insight system built for the **Canara Bank SuRaksha Hackathon**. It detects whether submitted documents have been tampered with, whether their dates and values are logically consistent, and generates actionable **DRISHTI Insight Cards** that explain _why_ a detected anomaly matters — turning raw fraud signals into underwriter-ready intelligence.

> **🔒 Fully Offline** — All processing runs locally. No data leaves your machine. Zero external API calls.

---

## ✨ Key Features

| Category | Feature | Description |
|---|---|---|
| 🔐 **Layer 1** | Cryptographic Hash Verification | SHA-256 hash comparison to detect any byte-level document tampering |
| 🧬 **Layer 2** | Merkle Bundle Seal | Merkle tree root validates the integrity of the entire document bundle |
| 🕵️ **Layer 3** | Forensic PDF Analysis | Metadata inspection — creation/modification dates, producer tools, font anomalies |
| ⏱️ **Layer 4** | Temporal Logic Engine | 9 rule-based checks for impossible dates, backdating, and cross-document inconsistencies |
| 💡 **DRISHTI** | Insight Cards | 11 fraud pattern cards with severity, explanation, and recommended actions for underwriters |
| 📋 **Audit** | Tamper-Evident Audit Log | Immutable, hash-chained log of every verification event |
| 📂 **Smart Upload** | Auto Document Classifier | Keyword-based classifier that auto-identifies document types from a ZIP upload |
| 🏦 **Multi-Loan** | Verification Profiles | Supports Home Loan, Business Loan, Land Mutation, and MSME Loan document sets |

---

## 🏗️ Project Structure

```
pramanik-drishti/
│
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App entrypoint, CORS, startup
│   │   ├── issuance.py               # Document & bundle registration endpoints
│   │   ├── verification.py           # Bundle verification pipeline
│   │   ├── hash_engine.py            # SHA-256 hashing & Merkle tree
│   │   ├── forensics_engine.py       # PDF metadata forensic analysis
│   │   ├── temporal_engine.py        # 9 temporal fraud detection rules
│   │   ├── insight_engine.py         # DRISHTI Insight Card generator (11 patterns)
│   │   ├── document_classifier.py    # Auto-classifies documents from ZIP
│   │   ├── pdf_extractor.py          # Extracts structured data from PDFs
│   │   ├── database.py               # SQLite database setup & helpers
│   │   ├── models.py                 # Pydantic response models
│   │   └── demo.py                   # Demo setup/reset endpoints
│   │
│   ├── sample_docs/                  # Generated sample PDFs (clean & fraudulent)
│   ├── create_sample_docs.py         # Script to generate sample PDF documents
│   ├── demo_setup.py                 # Automated demo bundle registration
│   ├── demo_reset.py                 # Reset demo state
│   ├── run.py                        # Uvicorn server launcher
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variable template
│   ├── test_hash_engine.py           # Hash engine unit tests
│   └── test_forensics.py             # Forensics engine unit tests
│
├── frontend/                         # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                   # Root component & navigation state
│   │   ├── main.jsx                  # React DOM entry
│   │   ├── index.css                 # Global styles
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Home — system status & case history
│   │   │   ├── Register.jsx          # Bundle registration flow
│   │   │   ├── Verify.jsx            # Bundle verification input
│   │   │   ├── Results.jsx           # Verification results & insight cards
│   │   │   └── AuditLog.jsx          # Immutable audit trail viewer
│   │   ├── components/
│   │   │   ├── Layout.jsx            # App shell with sidebar navigation
│   │   │   ├── VerificationTypeSelector.jsx  # Loan type picker
│   │   │   ├── RequiredDocumentsList.jsx     # Document checklist
│   │   │   ├── DocumentUploadGrid.jsx        # Multi-file upload grid
│   │   │   ├── ZipUploadZone.jsx             # Drag-and-drop ZIP upload
│   │   │   ├── StatusBadge.jsx               # Pass/Fail/Warning badges
│   │   │   └── LoadingSpinner.jsx            # Loading indicator
│   │   ├── api/                      # Axios API client
│   │   ├── assets/                   # Static assets
│   │   └── constants/                # App constants
│   │
│   ├── index.html                    # HTML entry with Inter font
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   └── .env.example                  # Frontend env template
│
├── logs/                             # Application logs
├── vercel.json                       # Vercel deployment config
├── DEPLOYMENT.md                     # Render + Vercel deployment guide
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Python 3.11+** | Runtime |
| **FastAPI 0.111** | REST API framework |
| **Uvicorn** | ASGI server |
| **SQLite** | Local database (zero-config) |
| **pdfplumber** | PDF text extraction |
| **PyPDF2** | PDF metadata extraction |
| **holidays** | Indian public holiday calendar |
| **python-dateutil** | Date parsing utilities |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS 3.4** | Utility-first styling |
| **React Router DOM 7** | Client-side navigation |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |
| **React Dropzone** | Drag-and-drop file upload |

---

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | API health check & metadata |
| `GET` | `/system/status` | Detailed system status (layers, modes, capabilities) |
| `POST` | `/issuance/register-document` | Register a single document hash + extracted metadata |
| `POST` | `/issuance/register-bundle` | Register a bundle of documents and store a Merkle seal |
| `POST` | `/verify/bundle` | Full verification pipeline — hash, temporal, forensic, seal, insight cards |
| `GET` | `/verify/audit-log/{bundle_id}` | Fetch immutable audit log entries for a bundle |
| `GET` | `/docs` | Interactive Swagger API documentation |

---

## 🚨 Fraud Detection Patterns

Pramanik-Drishti detects **11 fraud patterns** across four detection layers:

| ID | Pattern Name | Affected Document | Detection Rule |
|---|---|---|---|
| FP-001 | Direct Document Tampering | Any document | SHA-256 hash mismatch (`HASH_FAIL`) |
| FP-002 | Identity Bundle Swap | Full application bundle | Merkle root mismatch (`BUNDLE_FAIL`) |
| FP-003 | Backdated ITR Fraud | Income Tax Return | Filing date precedes fiscal year end (`TEMP-01`) |
| FP-004 | Post-Sanction Valuation Backdating | Property Valuation Report | Valuation date is after sanction (`TEMP-02`) |
| FP-005 | Holiday Registration Fraud | Sale Deed | Registration on a public holiday (`TEMP-03`) |
| FP-006 | Non-Sequential Salary Slips | Salary Slips | Pay periods are not consecutive months (`TEMP-04`) |
| FP-007 | Income Inflation Across Documents | Salary Slip + ITR | Gross salary vs ITR income mismatch (`TEMP-05`) |
| FP-008 | Stale Valuation Report | Property Valuation Report | Valuation older than 6 months (`TEMP-06`) |
| FP-009 | Seller-Owner Identity Mismatch | Sale Deed + Land Record | Seller name ≠ land record owner (`TEMP-07`) |
| FP-010 | PDF Metadata Anomaly | Any document | Forensic metadata flags (tool, dates) |
| FP-011 | Structural Inconsistency | Any document | Font/content structural anomalies |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/lembheharsh18/Pramanik-Drishti.git
cd Pramanik-Drishti
```

### 2. Set Up the Backend

```bash
cd backend

# (Optional) Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install reportlab requests pytest

# Copy environment template
cp .env.example .env

# Generate sample PDF documents (clean + fraudulent)
python create_sample_docs.py

# Start the backend server
python run.py
```

The API will be running at **http://localhost:8000**. Open **http://localhost:8000/docs** to explore the Swagger UI.

### 3. Set Up the Frontend

Open a **new terminal** and run:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template (points to localhost backend by default)
cp .env.example .env

# Start the dev server
npm run dev
```

The frontend will be running at **http://localhost:5173**.

---

## 🎬 How It Works — Demo Walkthrough

Follow these steps to see Pramanik-Drishti in action end-to-end:

### Step 1 — Generate Sample Documents

```bash
cd backend
python create_sample_docs.py
```

This creates two sets of PDF documents inside `backend/sample_docs/`:
- **Clean documents** — Genuine, unmodified PDFs
- **Fraudulent documents** — PDFs with backdated ITRs, tampered hashes, mismatched names, etc.

### Step 2 — Start Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
python run.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 3 — Register a Clean Bundle

1. Open **http://localhost:5173** in your browser.
2. Click **"Register Bundle"** in the sidebar.
3. Select a **verification type** (e.g., Home Loan).
4. Enter an **Applicant ID** (e.g., `APP-CLEAN-001`).
5. Upload the **clean PDFs** from `backend/sample_docs/` (you can upload as a ZIP or individual files).
6. Click **Register**. The system will:
   - Compute SHA-256 hashes for each document
   - Extract metadata (dates, amounts, names) from each PDF
   - Build a Merkle tree and store the bundle seal
7. **Copy the returned Bundle ID** — you'll need it for verification.

### Step 4 — Verify the Clean Bundle

1. Click **"Verify Bundle"** in the sidebar.
2. Enter the **Bundle ID** from Step 3.
3. Upload the **same clean documents**.
4. Click **Verify**. You should see:
   - ✅ All document hashes **PASS**
   - ✅ Merkle bundle seal **PASS**
   - ✅ All temporal checks **PASS**
   - ✅ Forensic analysis **CLEAN**
   - 🟢 Zero DRISHTI Insight Cards (no fraud detected)

### Step 5 — Register & Verify a Fraudulent Bundle

1. Go back to **Register Bundle**.
2. Enter a new Applicant ID (e.g., `APP-FRAUD-001`).
3. Upload the **fraudulent PDFs** from `backend/sample_docs/`.
4. Register the bundle and copy the Bundle ID.
5. Go to **Verify Bundle**, enter the Bundle ID, upload the same fraudulent documents.
6. This time you should see:
   - 🔴 Red **DRISHTI Insight Cards** highlighting detected fraud patterns
   - ⚠️ Temporal rule violations (backdated ITR, holiday registration, income inflation, etc.)
   - 📝 Each card includes severity, a plain-English explanation, and recommended actions for the underwriter

### Step 6 — Inspect the Audit Log

1. Click **"Audit Log"** in the sidebar.
2. Enter the Bundle ID of any verified bundle.
3. View the **tamper-evident, hash-chained audit trail** of every verification event — who verified what, when, and what was detected.

### (Optional) Automated Demo Setup

You can also run the demo programmatically:

```bash
cd backend
python demo_setup.py
```

This registers both clean and fraudulent bundles via the API automatically, so you can jump straight to verification in the browser.

---

## 📦 Deployment

For deploying to **Render** (backend) and **Vercel** (frontend), see the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

---

## 📝 License

This project was built for the **Canara Bank SuRaksha Hackathon**.

---

<div align="center">

_Built with ❤️ by the Pramanik-Drishti team_

</div>
]]>
