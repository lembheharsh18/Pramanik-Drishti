import datetime
import io
import json
import re

import dateutil.parser
import pdfplumber


MONTH_PATTERN = (
    r"January|February|March|April|May|June|July|August|September|October|"
    r"November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_texts = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(page_texts)
    except Exception:
        return ""


def parse_date_from_text(text_fragment: str) -> datetime.date | None:
    try:
        parsed = dateutil.parser.parse(text_fragment, dayfirst=True, fuzzy=True)
        return parsed.date()
    except Exception:
        return None


def extract_dates_by_pattern(full_text: str) -> list[datetime.date]:
    date_pattern = re.compile(
        rf"\b\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}}\b|"
        rf"\b\d{{1,2}}\s+(?:{MONTH_PATTERN})\s+\d{{4}}\b|"
        rf"\b(?:{MONTH_PATTERN})\s+\d{{1,2}},?\s+\d{{4}}\b",
        re.IGNORECASE,
    )

    dates = set()
    for match in date_pattern.finditer(full_text or ""):
        parsed = parse_date_from_text(match.group(0))
        if parsed:
            dates.add(parsed)

    return sorted(dates)


def extract_itr_data(full_text: str) -> dict:
    return {
        "filing_date": _find_date_near_keywords(
            full_text,
            [
                "date of filing",
                "filed on",
                "submission date",
                "acknowledgement date",
            ],
        ),
        "assessment_year": _find_first_match(
            full_text,
            [
                r"\bA\.?\s*Y\.?\s*[:\-]?\s*(\d{4}\s*-\s*\d{2})\b",
                r"\bAssessment\s+Year\s*[:\-]?\s*(\d{4}\s*-\s*\d{2})\b",
            ],
        ),
        "gross_income": _find_amount_near_keywords(
            full_text,
            ["gross total income", "total income", "net taxable income"],
        ),
        "pan_number": _find_first_match(full_text, [r"\b([A-Z]{5}[0-9]{4}[A-Z])\b"]),
    }


def extract_salary_slip_data(full_text: str) -> dict:
    slip_month, slip_year = _find_month_year_near_keywords(
        full_text,
        ["pay period", "salary for", "month of", "pay slip"],
    )

    return {
        "slip_month": slip_month,
        "slip_year": slip_year,
        "gross_salary": _find_amount_near_keywords(
            full_text,
            ["gross salary", "gross pay", "total earnings", "gross ctc"],
        ),
        "employer_name": _find_line_value(
            full_text,
            ["employer:", "company:", "organisation:"],
        ),
        "employee_name": _find_line_value(full_text, ["employee:", "employee name:"]),
    }


def extract_valuation_data(full_text: str) -> dict:
    return {
        "valuation_date": _find_date_near_keywords(
            full_text,
            ["date of valuation", "valuation date", "report date", "valued on"],
        ),
        "property_value": _find_amount_near_keywords(
            full_text,
            ["market value", "fair value", "estimated value", "valuation amount"],
        ),
        "property_address": _find_line_value(
            full_text,
            ["property address:", "address:"],
        ),
        "valuer_name": _find_line_value(full_text, ["valuer:", "valuer name:"]),
    }


def extract_sale_deed_data(full_text: str) -> dict:
    return {
        "registration_date": _find_date_near_keywords(
            full_text,
            ["registered on", "date of registration", "executed on"],
        ),
        "seller_name": _find_line_value(
            full_text,
            ["vendor:", "seller:", "transferor:", "from:"],
        ),
        "buyer_name": _find_line_value(
            full_text,
            ["vendee:", "buyer:", "transferee:", "to:"],
        ),
        "property_address": _find_line_value(
            full_text,
            ["property address:", "schedule property:", "address:"],
        ),
        "stamp_duty_amount": _find_amount_near_keywords(
            full_text,
            ["stamp duty", "stamp duty amount"],
        ),
    }


def extract_land_record_data(full_text: str) -> dict:
    return {
        "owner_name": _find_line_value(
            full_text,
            ["owner:", "khatedar:", "pattedar:", "registered owner:"],
        ),
        "survey_number": _find_line_value(
            full_text,
            ["survey no", "khasra no", "plot no", "s.no"],
        ),
        "issue_date": _find_date_near_keywords(
            full_text,
            ["issue date", "issued on", "date of issue"],
        ),
        "district": _find_line_value(full_text, ["district:"]),
    }


def extract_property_tax_data(full_text: str) -> dict:
    return {
        "owner_name": _find_line_value(
            full_text,
            ["owner name:", "assessee name:", "name of owner:"],
        ),
        "receipt_date": _find_date_near_keywords(
            full_text,
            ["receipt date", "payment date", "paid on", "date:"],
        ),
        "tax_amount": _find_amount_near_keywords(
            full_text,
            ["tax paid", "amount paid", "total amount", "receipt amount"],
        ),
        "property_id": _find_line_value(
            full_text,
            ["property id:", "assessment number:", "pid no:"],
        ),
    }


def extract_bank_statement_data(full_text: str) -> dict:
    return {
        "account_holder": _find_line_value(
            full_text,
            ["name:", "account name:", "customer name:"],
        ),
        "account_number": _find_line_value(
            full_text,
            ["account no:", "a/c no:", "account number:"],
        ),
        "statement_period": _find_first_match(
            full_text,
            [
                r"period\s*[:\-]?\s*([0-9]{1,2}[/-][a-zA-Z0-9]+[/-][0-9]{2,4}\s*to\s*[0-9]{1,2}[/-][a-zA-Z0-9]+[/-][0-9]{2,4})",
                r"from\s*([0-9]{1,2}[/-][a-zA-Z0-9]+[/-][0-9]{2,4})\s*to\s*([0-9]{1,2}[/-][a-zA-Z0-9]+[/-][0-9]{2,4})",
            ],
        ),
        "total_credits": _find_amount_near_keywords(
            full_text,
            ["total credit", "total credits", "sum of credits", "credit total"],
        ),
        "total_debits": _find_amount_near_keywords(
            full_text,
            ["total debit", "total debits", "sum of debits", "debit total"],
        ),
        "closing_balance": _find_amount_near_keywords(
            full_text,
            ["closing balance", "balance at end", "available balance"],
        ),
    }


def extract_gst_returns_data(full_text: str) -> dict:
    return {
        "gstin": _find_first_match(
            full_text,
            [r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b"],
        ),
        "legal_name": _find_line_value(
            full_text,
            ["legal name:", "name of taxpayer:", "trade name:"],
        ),
        "return_period": _find_line_value(
            full_text,
            ["tax period:", "return period:", "month/year:"],
        ),
        "total_turnover": _find_amount_near_keywords(
            full_text,
            ["taxable value", "total turnover", "gross turnover"],
        ),
        "total_tax_paid": _find_amount_near_keywords(
            full_text,
            ["total tax", "tax paid", "tax liability"],
        ),
    }


def extract_business_registration_data(full_text: str) -> dict:
    return {
        "company_name": _find_line_value(
            full_text,
            ["name of company:", "entity name:", "business name:"],
        ),
        "registration_number": _find_first_match(
            full_text,
            [r"\b(U[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b", r"\b(L[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b"],
        ),
        "date_of_incorporation": _find_date_near_keywords(
            full_text,
            ["date of incorporation", "registered on", "issued on"],
        ),
        "company_type": _find_line_value(
            full_text,
            ["type of company:", "class of company:"],
        ),
    }


def _find_first_match(full_text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, full_text or "", re.IGNORECASE)
        if match:
            return _clean_text(match.group(1))
    return None


def _find_line_value(full_text: str, keywords: list[str]) -> str | None:
    for line in (full_text or "").splitlines():
        stripped_line = line.strip()
        for keyword in keywords:
            pattern = rf"{re.escape(keyword)}\s*(.+)$"
            match = re.search(pattern, stripped_line, re.IGNORECASE)
            if match:
                value = _clean_text(match.group(1))
                if value:
                    return value
    return None


def _find_date_near_keywords(full_text: str, keywords: list[str]) -> str | None:
    for fragment in _keyword_fragments(full_text, keywords):
        dates = extract_dates_by_pattern(fragment)
        if dates:
            return dates[0].isoformat()
    return None


def _find_month_year_near_keywords(
    full_text: str, keywords: list[str]
) -> tuple[int | None, int | None]:
    for fragment in _keyword_fragments(full_text, keywords):
        parsed = parse_date_from_text(fragment)
        if parsed:
            return parsed.month, parsed.year

        match = re.search(
            rf"\b({MONTH_PATTERN})\b\s*[-,]?\s*(\d{{4}})\b",
            fragment,
            re.IGNORECASE,
        )
        if match:
            parsed = parse_date_from_text(f"1 {match.group(1)} {match.group(2)}")
            if parsed:
                return parsed.month, parsed.year

    return None, None


def _find_amount_near_keywords(full_text: str, keywords: list[str]) -> float | None:
    amount_pattern = re.compile(
        r"(?:Rs\.?|INR|\u20b9)?\s*([0-9][0-9,]*(?:\.\d+)?)",
        re.IGNORECASE,
    )

    for fragment in _keyword_fragments(full_text, keywords, before=0, after=140):
        for match in amount_pattern.finditer(fragment):
            amount = _parse_amount(match.group(0))
            if amount is not None:
                return amount

    return None


def _keyword_fragments(
    full_text: str, keywords: list[str], before: int = 20, after: int = 120
) -> list[str]:
    fragments = []
    text = full_text or ""
    lower_text = text.lower()

    for keyword in keywords:
        keyword_lower = keyword.lower()
        start = 0
        while True:
            index = lower_text.find(keyword_lower, start)
            if index == -1:
                break
            fragment_start = max(0, index - before)
            fragment_end = min(len(text), index + len(keyword) + after)
            fragments.append(text[fragment_start:fragment_end])
            start = index + len(keyword)

    return fragments


def _parse_amount(value: str) -> float | None:
    cleaned = (
        value.replace(",", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .replace("INR", "")
        .replace("\u20b9", "")
        .strip()
    )

    match = re.search(r"[0-9]+(?:\.\d+)?", cleaned)
    if not match:
        return None

    try:
        return float(match.group(0))
    except ValueError:
        return None


def _clean_text(value: str) -> str | None:
    cleaned = re.sub(r"\s+", " ", value or "").strip(" :-\t")
    return cleaned or None
