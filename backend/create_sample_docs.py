from pathlib import Path
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


SAMPLE_DIR = Path(__file__).parent / "sample_docs"
FONT_NAME = "Helvetica"


def register_font() -> None:
    global FONT_NAME

    font_candidates = [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/Nirmala.ttf"),
        Path("C:/Windows/Fonts/seguiemj.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/Library/Fonts/Arial Unicode.ttf"),
    ]

    for font_path in font_candidates:
        if font_path.exists():
            pdfmetrics.registerFont(TTFont("PramanikFont", str(font_path)))
            FONT_NAME = "PramanikFont"
            return


def create_pdf(filename: str, title: str, lines: list[str]) -> None:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    path = SAMPLE_DIR / filename
    pdf = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    margin = 48
    y = height - 56

    pdf.setFillColor(colors.HexColor("#2D1B8E"))
    pdf.rect(0, height - 96, width, 96, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont(FONT_NAME, 15)
    pdf.drawString(margin, height - 42, title)
    pdf.setFont(FONT_NAME, 9)
    pdf.drawString(margin, height - 66, "Canara Bank SuRaksha Hackathon Demo Document")

    y -= 72
    pdf.setFillColor(colors.HexColor("#1A1A2E"))
    pdf.setFont(FONT_NAME, 10)

    for line in lines:
        if line == "__STAMP__":
            y = draw_stamp_area(pdf, margin, y)
            continue

        if line.startswith("SECTION:"):
            y -= 12
            pdf.setFillColor(colors.HexColor("#0F6E56"))
            pdf.setFont(FONT_NAME, 11)
            pdf.drawString(margin, y, line.replace("SECTION:", "").strip())
            pdf.setFont(FONT_NAME, 10)
            pdf.setFillColor(colors.HexColor("#1A1A2E"))
            y -= 18
            continue

        for wrapped_line in wrap(line, width=90) or [""]:
            pdf.drawString(margin, y, wrapped_line)
            y -= 16

        if y < 80:
            pdf.showPage()
            pdf.setFont(FONT_NAME, 10)
            pdf.setFillColor(colors.HexColor("#1A1A2E"))
            y = height - 56

    pdf.setFont(FONT_NAME, 8)
    pdf.setFillColor(colors.HexColor("#6B7280"))
    pdf.drawString(margin, 32, "Generated for PRAMANIK-DRISHTI demo verification only.")
    pdf.save()


def draw_stamp_area(pdf: canvas.Canvas, margin: int, y: float) -> float:
    y -= 8
    pdf.setStrokeColor(colors.HexColor("#0F6E56"))
    pdf.setLineWidth(1)
    pdf.roundRect(margin, y - 88, 220, 72, 6, stroke=1, fill=0)
    pdf.setFillColor(colors.HexColor("#0F6E56"))
    pdf.setFont(FONT_NAME, 9)
    pdf.drawString(margin + 16, y - 36, "REGISTRAR STAMP AREA")
    pdf.drawString(margin + 16, y - 56, "Seal / Signature / Date")
    pdf.setFillColor(colors.HexColor("#1A1A2E"))
    return y - 112


def land_record_lines() -> list[str]:
    return [
        "SECTION:Ownership Details",
        "Owner: Mohan Patil",
        "Survey No: 142/B, Village: Hadapsar, District: Pune",
        "Issue Date: 15 March 2022",
        "Land Use: Residential",
        "Mutation Entry: Verified by district land records office",
        "__STAMP__",
    ]


def salary_slip_lines(month: str, year: int, applicant: str, pan: str) -> list[str]:
    return [
        f"SECTION:Pay Slip - {month} {year}",
        "Company: Infosys Limited, Pune",
        f"Employee: {applicant}",
        f"Month: {month} {year}",
        "Basic Salary: ₹75,000",
        "HRA: ₹30,000",
        "Other Allowances: ₹15,000",
        "Gross Salary: ₹1,20,000",
        f"PAN: {pan}",
        "Net Pay credited through bank transfer.",
    ]


def itr_clean_lines() -> list[str]:
    return [
        "SECTION:Income Tax Return Acknowledgement",
        "Assessment Year: 2023-24",
        "PAN: ABCDE1234F",
        "Name: Suresh Ramakrishnan",
        "Date of Filing: 28 July 2023",
        "Gross Total Income: ₹14,40,000",
        "Tax Paid: ₹1,82,000",
        "Acknowledgement Number: 123456789012345",
    ]


def itr_fraud_lines() -> list[str]:
    return [
        "SECTION:Income Tax Return Acknowledgement",
        "Assessment Year: 2024-25",
        "PAN: ABCDE1234F",
        "Name: Suresh Ramakrishnan",
        "Date of Filing: 12 February 2024",
        "Gross Total Income: ₹8,20,000",
        "Tax Paid: ₹64,000",
        "Acknowledgement Number: 987654321098765",
    ]


def valuation_lines() -> list[str]:
    return [
        "SECTION:Property Valuation Report",
        "Date of Valuation: 10 January 2026",
        "Property: Survey No 142/B, Hadapsar, Pune",
        "Market Value: ₹85,00,000",
        "Valuer: Prakash Mehta, Registered Valuer No. RV/MH/2019/0234",
        "Method: Comparable sales method with site inspection",
    ]


def sale_deed_clean_lines() -> list[str]:
    return [
        "SECTION:Registered Sale Deed",
        "Registered on: 14 November 2023",
        "Vendor: Mohan Patil",
        "Vendee: Suresh Ramakrishnan",
        "Property: Survey No 142/B, Hadapsar, Pune",
        "Stamp Duty: ₹4,25,000",
        "Registration Number: PUNE/2023/SR-4721",
    ]


def sale_deed_fraud_lines() -> list[str]:
    return [
        "SECTION:Registered Sale Deed",
        "Registered on: 26 January 2025",
        "Seller: Rajesh Kumar",
        "Vendee: Suresh Ramakrishnan",
        "Property: Survey No 142/B, Hadapsar, Pune",
        "Stamp Duty: ₹4,25,000",
        "Registration Number: PUNE/2025/SR-1119",
    ]


def generate_documents() -> tuple[list[str], list[str]]:
    clean_files = [
        "land_record_clean.pdf",
        "salary_slip_jan_clean.pdf",
        "salary_slip_feb_clean.pdf",
        "salary_slip_mar_clean.pdf",
        "itr_clean.pdf",
        "valuation_report_clean.pdf",
        "sale_deed_clean.pdf",
    ]
    fraud_files = [
        "land_record_fraud.pdf",
        "salary_slip_jan_fraud.pdf - baseline January slip",
        "salary_slip_feb_fraud.pdf - baseline February slip",
        "salary_slip_apr_fraud.pdf - March skipped, non-consecutive salary sequence",
        "itr_fraud.pdf - backdated filing date and income inconsistency",
        "valuation_report_fraud.pdf - baseline valuation report",
        "sale_deed_fraud.pdf - holiday registration and seller mismatch",
    ]

    create_pdf(
        "land_record_clean.pdf",
        "LAND OWNERSHIP RECORD — MAHARASHTRA",
        land_record_lines(),
    )
    create_pdf(
        "land_record_fraud.pdf",
        "LAND OWNERSHIP RECORD — MAHARASHTRA",
        land_record_lines(),
    )

    create_pdf(
        "salary_slip_jan_clean.pdf",
        "SALARY SLIP — JANUARY 2024",
        salary_slip_lines("January", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )
    create_pdf(
        "salary_slip_feb_clean.pdf",
        "SALARY SLIP — FEBRUARY 2024",
        salary_slip_lines("February", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )
    create_pdf(
        "salary_slip_mar_clean.pdf",
        "SALARY SLIP — MARCH 2024",
        salary_slip_lines("March", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )

    create_pdf(
        "salary_slip_jan_fraud.pdf",
        "SALARY SLIP — JANUARY 2024",
        salary_slip_lines("January", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )
    create_pdf(
        "salary_slip_feb_fraud.pdf",
        "SALARY SLIP — FEBRUARY 2024",
        salary_slip_lines("February", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )
    create_pdf(
        "salary_slip_apr_fraud.pdf",
        "SALARY SLIP — APRIL 2024",
        salary_slip_lines("April", 2024, "Suresh Ramakrishnan", "ABCDE1234F"),
    )

    create_pdf("itr_clean.pdf", "INCOME TAX RETURN — ACKNOWLEDGEMENT", itr_clean_lines())
    create_pdf("itr_fraud.pdf", "INCOME TAX RETURN — ACKNOWLEDGEMENT", itr_fraud_lines())

    create_pdf(
        "valuation_report_clean.pdf",
        "PROPERTY VALUATION REPORT",
        valuation_lines(),
    )
    create_pdf(
        "valuation_report_fraud.pdf",
        "PROPERTY VALUATION REPORT",
        valuation_lines(),
    )

    create_pdf("sale_deed_clean.pdf", "SALE DEED — REGISTERED COPY", sale_deed_clean_lines())
    create_pdf("sale_deed_fraud.pdf", "SALE DEED — REGISTERED COPY", sale_deed_fraud_lines())

    return clean_files, fraud_files


if __name__ == "__main__":
    register_font()
    clean, fraud = generate_documents()

    print(f"Generated {len(clean) + len(fraud)} sample documents:")
    print(f"  Bundle A (clean): {clean}")
    print(f"  Bundle B (fraudulent): {fraud}")
