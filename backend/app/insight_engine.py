import datetime
import hashlib
import json
import uuid

from app.models import CheckStatus, FraudPattern, InsightCard, TemporalCheckResult


FRAUD_PATTERNS = {
    "HASH_FAIL": FraudPattern(
        pattern_id="FP-001",
        pattern_name="Direct Document Tampering",
        affected_document="[document name filled at runtime]",
        failed_check="Cryptographic hash mismatch",
        explanation="The submitted document does not match the cryptographic hash recorded at issuance. The file has been modified after the original was issued. This is the most direct form of document fraud - the content has been physically altered.",
        recommended_actions=[
            "Reject this application immediately",
            "Preserve the submitted document as digital evidence",
            "Flag applicant ID in the fraud risk registry",
            "File a Suspicious Transaction Report (STR) with FIU-IND",
            "Do not contact the applicant - escalate to fraud cell",
        ],
        severity="HIGH",
    ),
    "BUNDLE_FAIL": FraudPattern(
        pattern_id="FP-002",
        pattern_name="Identity Bundle Swap",
        affected_document="Full application bundle",
        failed_check="Merkle tree bundle seal broken",
        explanation="The Merkle root of the submitted document bundle does not match the stored root. One or more documents have been replaced - even if the replacement document appears genuine in isolation. This is a sophisticated fraud where a fraudster substitutes another person's authentic document into a different application bundle.",
        recommended_actions=[
            "Reject this application immediately",
            "Identify which document hash changed by comparing individual hashes",
            "Flag the application bundle ID in the fraud registry",
            "Cross-reference all documents against their named applicant's previous applications",
            "Escalate to fraud cell - bundle swap requires insider knowledge or document theft",
        ],
        severity="HIGH",
    ),
    "TEMP-01": FraudPattern(
        pattern_id="FP-003",
        pattern_name="Backdated ITR Fraud",
        affected_document="Income Tax Return",
        failed_check="ITR filing date precedes fiscal year end",
        explanation="The Income Tax Return shows a filing date before the financial year it covers has ended. A genuine ITR can only be filed after the fiscal year closes on 31 March. This document has either been fabricated with an impossible date or digitally altered to show an earlier date.",
        recommended_actions=[
            "Reject this ITR and do not use it for income verification",
            "Request the original ITR directly from the TRACES portal (www.tdscpc.gov.in)",
            "Verify ITR acknowledgement number on the Income Tax e-filing portal",
            "Flag the PAN number associated with this ITR",
            "Cross-check with Form 26AS for actual income reported",
        ],
        severity="HIGH",
    ),
    "TEMP-02": FraudPattern(
        pattern_id="FP-004",
        pattern_name="Post-Sanction Valuation Backdating",
        affected_document="Property Valuation Report",
        failed_check="Valuation date is after loan sanction date",
        explanation="The property valuation report is dated after the loan was already sanctioned. A property must be valued before a bank can sanction a loan against it. This report was either fabricated after the fact or the date has been altered to appear compliant.",
        recommended_actions=[
            "Do not use this valuation report",
            "Commission an independent fresh valuation from a bank-empanelled valuer",
            "Verify the valuer's registration number with the registered valuers organisation",
            "Review the loan sanction timeline for procedural violations",
            "Check if the sanctioning officer and the valuer have any prior relationship",
        ],
        severity="HIGH",
    ),
    "TEMP-03": FraudPattern(
        pattern_id="FP-005",
        pattern_name="Holiday Registration Fraud",
        affected_document="Sale Deed",
        failed_check="Sale deed registered on a court holiday or Sunday",
        explanation="The sale deed shows registration on a date when sub-registrar offices are legally closed. Property registration cannot occur on Sundays or public holidays. This date is either fabricated or the document is forged.",
        recommended_actions=[
            "Contact the sub-registrar office to verify if this registration exists in their records",
            "Request the original certified copy of the registered deed from the registrar",
            "Check the registration number in the state's online property registration portal",
            "If no matching registration found, file a police complaint for document forgery",
        ],
        severity="HIGH",
    ),
    "TEMP-04": FraudPattern(
        pattern_id="FP-006",
        pattern_name="Non-Sequential Salary Slip Submission",
        affected_document="Salary Slips",
        failed_check="Salary slips are not from consecutive months",
        explanation="The three salary slips submitted are not from three consecutive months. Banks require the last three consecutive months' slips to establish stable ongoing income. Gaps in the sequence suggest deliberate omission - possibly hiding a period of unemployment, pay cut, or job change that would affect loan eligibility.",
        recommended_actions=[
            "Reject the submitted salary slips",
            "Request salary slips for the specific missing months",
            "Request a salary certificate directly from the employer on letterhead",
            "Verify employment directly with the employer's HR department",
            "Cross-check against bank statement credits for the corresponding months",
        ],
        severity="MEDIUM",
    ),
    "TEMP-05": FraudPattern(
        pattern_id="FP-007",
        pattern_name="Income Inflation Across Documents",
        affected_document="Salary Slip and Income Tax Return",
        failed_check="Annualised salary significantly exceeds ITR declared income",
        explanation="The monthly salary shown on the salary slip, when multiplied by 12, is more than 20% higher than the gross income declared in the Income Tax Return. Both documents are submitted together, but they report materially different income figures. Either the salary slip has been inflated or the ITR understates income - in either case, the documents are inconsistent and cannot both be genuine.",
        recommended_actions=[
            "Request Form 16 directly from the employer to verify salary",
            "Cross-reference with bank statement credits for the last 12 months",
            "Request ITR with computation of income from the applicant",
            "Verify gross income on Form 26AS which shows employer-reported salary",
            "Do not use either document for income calculation until verified",
        ],
        severity="HIGH",
    ),
    "TEMP-06": FraudPattern(
        pattern_id="FP-008",
        pattern_name="Stale Valuation Report",
        affected_document="Property Valuation Report",
        failed_check="Valuation report is older than 180 days",
        explanation="The property valuation report is more than 6 months old. Property values in India fluctuate significantly, particularly in urban and peri-urban areas. A stale valuation may not reflect current market conditions and creates risk that the loan amount exceeds the property's current market value.",
        recommended_actions=[
            "Commission a fresh valuation from a bank-empanelled valuer",
            "Do not proceed with loan processing until a current valuation is available",
            "Check if the property market in the area has had significant changes in the period",
        ],
        severity="MEDIUM",
    ),
    "TEMP-07": FraudPattern(
        pattern_id="FP-009",
        pattern_name="Seller-Owner Identity Mismatch",
        affected_document="Sale Deed and Land Record",
        failed_check="Sale deed seller name does not match land record owner name",
        explanation="The person named as seller in the sale deed is different from the registered owner in the land record. Only the registered owner can legally sell a property. This mismatch indicates either a forged sale deed, a forged land record, or the sale of a property the seller does not legally own.",
        recommended_actions=[
            "Do not proceed - this is a potential property fraud",
            "Obtain certified copies of both documents from their issuing authorities",
            "Verify ownership with the district land records office (tehsildar)",
            "Check if any power of attorney exists authorising the seller",
            "Escalate to legal team before any further processing",
        ],
        severity="HIGH",
    ),
    "TEMP-08": FraudPattern(
        pattern_id="FP-010",
        pattern_name="Property Value Inconsistency",
        affected_document="Sale Deed and Valuation Report",
        failed_check="Sale deed value is severely misaligned with property valuation",
        explanation="The transaction value recorded in the sale deed is extremely low (<20%) or extremely high (>5x) compared to the assessed market value in the valuation report. This indicates potential stamp duty evasion (undervaluation) or money laundering/loan fraud (overvaluation).",
        recommended_actions=[
            "Review the circle rate / guideline value for the property locality",
            "Verify the payment of consideration through bank channels",
            "Interview the applicant regarding the transaction rationale",
            "Escalate for enhanced due diligence review"
        ],
        severity="HIGH",
    ),
    "TEMP-09": FraudPattern(
        pattern_id="FP-011",
        pattern_name="Unexplained Bank Credits",
        affected_document="Bank Statement and Income Tax Return",
        failed_check="Annualised bank credits significantly exceed declared gross income",
        explanation="The total credits in the bank statement, when annualised, are more than 3 times the gross income declared in the Income Tax Return. This massive discrepancy suggests undisclosed business income, circular transactions, or use of the account as a pass-through entity.",
        recommended_actions=[
            "Request a detailed explanation of major credits from the applicant",
            "Cross-verify high-value credits against business invoices or loan agreements",
            "Check for matching debits to identify circular fund routing",
            "File a Suspicious Transaction Report (STR) if no satisfactory explanation is provided"
        ],
        severity="HIGH",
    ),
}


def generate_insight_cards(
    bundle_id: str,
    hash_failures: list[dict],
    bundle_seal_failed: bool,
    temporal_results: list[TemporalCheckResult],
) -> list[InsightCard]:
    cards = []

    for hash_failure in hash_failures:
        pattern = FRAUD_PATTERNS["HASH_FAIL"].model_copy(
            update={
                "affected_document": hash_failure.get("filename")
                or hash_failure.get("doc_type")
                or "[unknown document]"
            },
            deep=True,
        )
        cards.append(_build_card(bundle_id, pattern))

    if bundle_seal_failed:
        cards.append(_build_card(bundle_id, FRAUD_PATTERNS["BUNDLE_FAIL"]))

    for result in temporal_results:
        if result.status == CheckStatus.FAIL or result.status == CheckStatus.FAIL.value:
            pattern = FRAUD_PATTERNS.get(result.rule_id)
            if pattern:
                cards.append(_build_card(bundle_id, pattern))

    return cards


def _build_card(bundle_id: str, fraud_pattern: FraudPattern) -> InsightCard:
    card_data = {
        "card_id": str(uuid.uuid4()),
        "bundle_id": bundle_id,
        "fraud_pattern": fraud_pattern.model_dump(),
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }
    result_hash = hashlib.sha256(
        json.dumps(card_data, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return InsightCard(**card_data, result_hash=result_hash)
