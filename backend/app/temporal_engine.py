import datetime
import json

import holidays

from app.models import CheckStatus, TemporalCheckResult


INDIAN_HOLIDAYS = holidays.India(years=range(2020, 2027))


def check_itr_filing_date(itr_data: dict) -> TemporalCheckResult:
    rule_id = "TEMP-01"
    rule_name = "ITR Filing Date Validity"
    filing_date = _parse_date(itr_data.get("filing_date"))
    assessment_year = itr_data.get("assessment_year")

    if filing_date is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            None,
            "Extractable filing date",
            "Filing date could not be extracted from ITR",
            "LOW",
        )

    fiscal_year_end = _parse_fiscal_year_end(assessment_year)
    if fiscal_year_end is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            filing_date,
            "Valid assessment year",
            "Assessment year could not be extracted from ITR",
            "LOW",
        )

    if filing_date <= fiscal_year_end:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            filing_date,
            f"After {fiscal_year_end}",
            f"ITR for AY {assessment_year} filed on {filing_date}, but the fiscal year does not end until {fiscal_year_end}. A genuine return cannot be filed before the year ends.",
            "HIGH",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        filing_date,
        f"After {fiscal_year_end}",
        "Filing date is after fiscal year end — logically valid",
        "LOW",
    )


def check_valuation_before_sanction(
    valuation_data: dict, sanction_date_str: str | None
) -> TemporalCheckResult:
    rule_id = "TEMP-02"
    rule_name = "Valuation Before Loan Sanction"
    sanction_date = _parse_date(sanction_date_str)
    valuation_date = _parse_date(valuation_data.get("valuation_date"))

    if sanction_date is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            valuation_date,
            "Loan sanction date",
            "Loan sanction date not available for comparison",
            "LOW",
        )

    if valuation_date is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            None,
            f"On or before {sanction_date}",
            "Valuation date could not be extracted",
            "LOW",
        )

    if valuation_date > sanction_date:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            valuation_date,
            f"On or before {sanction_date}",
            f"Property valued on {valuation_date} but loan was sanctioned on {sanction_date}. Property must be valued before loan sanction.",
            "HIGH",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        valuation_date,
        f"On or before {sanction_date}",
        "Property valuation date is before loan sanction date",
        "LOW",
    )


def check_deed_registration_day(sale_deed_data: dict) -> TemporalCheckResult:
    rule_id = "TEMP-03"
    rule_name = "Sale Deed Registration on Working Day"
    registration_date = _parse_date(sale_deed_data.get("registration_date"))

    if registration_date is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            None,
            "Working-day registration date",
            "Registration date could not be extracted",
            "LOW",
        )

    if registration_date.weekday() == 6:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            registration_date,
            "Non-holiday weekday",
            f"Sale deed registered on {registration_date} which is a Sunday. Sub-registrar offices are closed on Sundays.",
            "HIGH",
        )

    if registration_date in INDIAN_HOLIDAYS:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            registration_date,
            "Non-holiday weekday",
            f"Sale deed registered on {registration_date} which is {INDIAN_HOLIDAYS.get(registration_date)}. Registrar offices are closed on public holidays.",
            "HIGH",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        registration_date,
        "Non-holiday weekday",
        "Sale deed registration date falls on a working day",
        "LOW",
    )


def check_salary_slip_sequence(
    salary_slips_data: list[dict],
) -> TemporalCheckResult:
    rule_id = "TEMP-04"
    rule_name = "Salary Slip Month Continuity"
    valid_months = []

    for slip_data in salary_slips_data:
        slip_month = slip_data.get("slip_month")
        slip_year = slip_data.get("slip_year")
        if slip_month is not None and slip_year is not None:
            valid_months.append((int(slip_year), int(slip_month)))

    if len(valid_months) < 3:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            valid_months,
            "Three consecutive salary slip months",
            "Could not extract month data from all salary slips",
            "LOW",
        )

    sorted_months = sorted(valid_months)
    months_list = [(year, month) for year, month in sorted_months]
    has_gap_or_repeat = any(
        _month_difference(sorted_months[index], sorted_months[index + 1]) != 1
        for index in range(len(sorted_months) - 1)
    )

    if has_gap_or_repeat:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            months_list,
            "Three consecutive salary slip months",
            f"Salary slips are not from consecutive months. Months found: {months_list}. This suggests selective submission to hide employment gaps.",
            "MEDIUM",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        months_list,
        "Three consecutive salary slip months",
        "Salary slips are from consecutive months",
        "LOW",
    )


def check_income_consistency(
    itr_data: dict, salary_slip_data: dict
) -> TemporalCheckResult:
    rule_id = "TEMP-05"
    rule_name = "Income Consistency Across Documents"
    gross_income = itr_data.get("gross_income")
    gross_salary = salary_slip_data.get("gross_salary")

    if gross_income is None or gross_salary is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            json.dumps(
                {"gross_income": gross_income, "gross_salary": gross_salary},
                sort_keys=True,
            ),
            "ITR gross income and salary slip gross salary",
            "Income data could not be extracted from ITR or salary slip",
            "LOW",
        )

    gross_income = float(gross_income)
    gross_salary = float(gross_salary)
    annualised_salary = gross_salary * 12
    tolerance = 0.20

    if annualised_salary > gross_income * (1 + tolerance):
        difference = annualised_salary - gross_income
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            f"Annualised salary: ₹{annualised_salary:,.0f}; ITR gross income: ₹{gross_income:,.0f}",
            "Annualised salary within 20% of ITR gross income",
            f"Monthly salary of ₹{gross_salary:,.0f} annualised to ₹{annualised_salary:,.0f} but ITR declares gross income of ₹{gross_income:,.0f}. Difference of ₹{difference:,.0f} exceeds 20% tolerance.",
            "HIGH",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        f"Annualised salary: ₹{annualised_salary:,.0f}; ITR gross income: ₹{gross_income:,.0f}",
        "Annualised salary within 20% of ITR gross income",
        "Income declared in ITR is consistent with salary slip data",
        "LOW",
    )


def check_valuation_recency(
    valuation_data: dict, application_date: datetime.date
) -> TemporalCheckResult:
    rule_id = "TEMP-06"
    rule_name = "Valuation Report Recency"
    valuation_date = _parse_date(valuation_data.get("valuation_date"))

    if valuation_date is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            None,
            f"Within 180 days of {application_date}",
            "Valuation date could not be extracted",
            "LOW",
        )

    age_days = (application_date - valuation_date).days
    max_age_days = 180

    if age_days > max_age_days:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            valuation_date,
            f"Within {max_age_days} days of {application_date}",
            f"Valuation report dated {valuation_date} is {age_days} days old. Reports older than 180 days are considered stale and may not reflect current market value.",
            "MEDIUM",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        valuation_date,
        f"Within {max_age_days} days of {application_date}",
        "Valuation report is recent enough for the application date",
        "LOW",
    )


def check_seller_owner_match(
    sale_deed_data: dict, land_record_data: dict
) -> TemporalCheckResult:
    rule_id = "TEMP-07"
    rule_name = "Seller-Owner Name Match"
    seller_name = sale_deed_data.get("seller_name")
    owner_name = land_record_data.get("owner_name")

    if seller_name is None or owner_name is None:
        return _result(
            rule_id,
            rule_name,
            CheckStatus.WARNING,
            json.dumps(
                {"seller_name": seller_name, "owner_name": owner_name},
                sort_keys=True,
            ),
            "Seller name and land record owner name",
            "Seller or owner name could not be extracted",
            "LOW",
        )

    if _normalise_name(seller_name) != _normalise_name(owner_name):
        return _result(
            rule_id,
            rule_name,
            CheckStatus.FAIL,
            f"Seller: {seller_name}; Owner: {owner_name}",
            "Seller and owner names must match",
            f"Sale deed seller '{seller_name}' does not match land record owner '{owner_name}'. The person selling the property is not the registered owner.",
            "HIGH",
        )

    return _result(
        rule_id,
        rule_name,
        CheckStatus.PASS,
        f"Seller: {seller_name}; Owner: {owner_name}",
        "Seller and owner names must match",
        "Sale deed seller matches the registered land record owner",
        "LOW",
    )


def run_all_temporal_checks(
    itr_data: dict,
    salary_slips_data: list[dict],
    valuation_data: dict,
    sale_deed_data: dict,
    land_record_data: dict,
    application_date: datetime.date,
    sanction_date_str: str | None = None,
) -> list[TemporalCheckResult]:
    first_salary_slip = salary_slips_data[0] if salary_slips_data else {}

    return [
        check_itr_filing_date(itr_data),
        check_valuation_before_sanction(valuation_data, sanction_date_str),
        check_deed_registration_day(sale_deed_data),
        check_salary_slip_sequence(salary_slips_data),
        check_income_consistency(itr_data, first_salary_slip),
        check_valuation_recency(valuation_data, application_date),
        check_seller_owner_match(sale_deed_data, land_record_data),
    ]


def _result(
    rule_id: str,
    rule_name: str,
    status: CheckStatus,
    found_value: object,
    expected_value: object,
    explanation: str,
    severity: str,
) -> TemporalCheckResult:
    return TemporalCheckResult(
        rule_id=rule_id,
        rule_name=rule_name,
        status=status,
        found_value="" if found_value is None else str(found_value),
        expected_value="" if expected_value is None else str(expected_value),
        explanation=explanation,
        severity=severity,
    )


def _parse_date(value: object) -> datetime.date | None:
    if value is None:
        return None
    if isinstance(value, datetime.datetime):
        return value.date()
    if isinstance(value, datetime.date):
        return value
    try:
        return datetime.date.fromisoformat(str(value))
    except ValueError:
        return None


def _parse_fiscal_year_end(assessment_year: object) -> datetime.date | None:
    if not assessment_year:
        return None
    try:
        first_year = int(str(assessment_year).split("-")[0].strip())
        return datetime.date(first_year, 3, 31)
    except (TypeError, ValueError):
        return None


def _month_difference(
    earlier_month: tuple[int, int], later_month: tuple[int, int]
) -> int:
    earlier_year, earlier_month_number = earlier_month
    later_year, later_month_number = later_month
    return (later_year - earlier_year) * 12 + (later_month_number - earlier_month_number)


def _normalise_name(name: str) -> str:
    return " ".join(name.strip().lower().split())
