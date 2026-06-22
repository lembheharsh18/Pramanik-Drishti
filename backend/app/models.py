from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DocumentType(str, Enum):
    LAND_RECORD = "land_record"
    SALARY_SLIP = "salary_slip"
    ITR = "itr"
    VALUATION_REPORT = "valuation_report"
    SALE_DEED = "sale_deed"


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"


class TemporalCheckResult(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    rule_id: str
    rule_name: str
    status: CheckStatus
    found_value: str
    expected_value: str
    explanation: str
    severity: str


class FraudPattern(BaseModel):
    pattern_id: str
    pattern_name: str
    affected_document: str
    failed_check: str
    explanation: str
    recommended_actions: list[str]
    severity: str


class InsightCard(BaseModel):
    card_id: str
    bundle_id: str
    fraud_pattern: FraudPattern
    generated_at: str
    result_hash: str


class DocumentVerificationResult(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    doc_id: str
    filename: str
    doc_type: str
    metadata: dict = Field(default_factory=dict)
    hash_status: CheckStatus
    hash_detail: str
    temporal_checks: list[TemporalCheckResult]
    has_fraud: bool


class BundleVerificationResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    bundle_id: str
    applicant_id: str
    total_documents: int
    bundle_seal_status: CheckStatus
    bundle_seal_detail: str
    document_results: list[DocumentVerificationResult]
    insight_cards: list[InsightCard]
    verification_time_seconds: float
    verified_at: str
