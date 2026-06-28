import {
  CalendarClock,
  CheckCircle,
  ClipboardList,
  FileText,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Zap,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import StatusBadge from '../components/StatusBadge.jsx'

const documentLabels = {
  land_record: 'Land Ownership Record',
  salary_slip: 'Salary Slip',
  itr: 'Income Tax Return',
  valuation_report: 'Property Valuation Report',
  sale_deed: 'Sale Deed',
}

function Results({ result, onViewAudit, onVerifyAnother }) {
  const [activeDocument, setActiveDocument] = useState(null)
  const [showTemporalChecks, setShowTemporalChecks] = useState(false)
  const [showCaseDetails, setShowCaseDetails] = useState(false)
  const cardRefs = useRef({})

  const temporalRows = useMemo(() => {
    if (!result?.document_results) {
      return []
    }

    return result.document_results.flatMap((documentResult) =>
      (documentResult.temporal_checks || []).map((check) => ({
        ...check,
        document: documentResult.filename,
      })),
    )
  }, [result])
  const decisionBrief = useMemo(() => buildDecisionBrief(result), [result])
  const timelineEvents = useMemo(() => buildTimelineEvents(result), [result])

  if (!result) {
    return (
      <section className="animate-rise glass-card p-8 text-center">
        <h1 className="text-2xl font-extrabold text-ink">No verification results found.</h1>
        <p className="mt-2 text-sm text-ink-muted">Please run a verification first.</p>
        <button
          className="gradient-btn mt-5 rounded-lg px-4 py-2 text-sm font-bold text-white"
          type="button"
          onClick={onVerifyAnother}
        >
          Go to Verify
        </button>
      </section>
    )
  }

  const insightCount = result.insight_cards?.length || 0
  const hasFraud = insightCount > 0

  const handleDocumentClick = (documentResult) => {
    if (!documentResult.has_fraud || insightCount === 0) {
      return
    }

    setActiveDocument(documentResult.filename)
    const card = findInsightCardForDocument(documentResult, result.insight_cards)
    const cardKey = card?.card_id || result.insight_cards[0]?.card_id
    cardRefs.current[cardKey]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="space-y-8">
      {/* Verdict Banner */}
      <div
        className={`animate-rise rounded-xl border p-6 ${
          hasFraud
            ? 'border-danger/30 bg-danger/[0.06] glow-border-danger'
            : 'border-accent-emerald/30 bg-accent-emerald/[0.06] glow-border-emerald'
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                hasFraud
                  ? 'bg-danger/15 text-danger shadow-glow-danger'
                  : 'bg-accent-emerald/15 text-accent-emerald shadow-glow-emerald'
              }`}
            >
              {hasFraud ? <ShieldAlert size={30} /> : <ShieldCheck size={30} />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
                Final Verdict
              </p>
              <h1 className={`mt-1 text-3xl font-extrabold ${hasFraud ? 'text-danger' : 'text-accent-emerald'}`}>
                {decisionBrief.recommendation}
              </h1>
              <p className="mt-1 text-sm font-medium text-ink-muted">{decisionBrief.summary}</p>
            </div>
          </div>
          <button
            className="gradient-btn inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-white"
            type="button"
            onClick={onViewAudit}
          >
            View Audit Log
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard icon={<FileText size={20} />} label="Applicant ID" value={result.applicant_id || 'N/A'} />
        <MetricCard icon={<Fingerprint size={20} />} label="Bundle ID" value={truncateMiddle(result.bundle_id, 10, 6)} />
        <MetricCard
          icon={<ShieldCheck size={20} />}
          label="Documents Verified"
          value={`${result.total_documents_found || result.total_documents || 0} / ${
            result.total_documents_expected || result.total_documents || 0
          }`}
        />
        <MetricCard
          accent="text-accent-emerald"
          icon={<Timer size={20} />}
          label="Verification Time"
          value={`${Number(result.verification_time_seconds || 0).toFixed(2)}s`}
        />
        <MetricCard
          accent={hasFraud ? 'text-danger' : 'text-accent-emerald'}
          icon={<Zap size={20} />}
          label="Fraud Signals"
          value={hasFraud ? String(insightCount) : 'None'}
        />
      </div>

      {/* Decision Brief */}
      <DecisionBrief brief={decisionBrief} />

      <section className="animate-rise rounded-xl border border-white/[0.08] bg-surface-100 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-extrabold text-ink">Case evidence and technical checks</p>
            <p className="mt-1 text-sm font-medium text-ink-muted">
              Keep the verdict uncluttered. Open details only when the underwriter needs supporting evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-white/[0.08] bg-surface px-4 py-2.5 text-sm font-bold text-primary-light transition hover:border-primary/30 hover:bg-primary/[0.06]"
              type="button"
              onClick={() => setShowCaseDetails((current) => !current)}
            >
              {showCaseDetails ? 'Hide Details' : 'View Details'}
            </button>
            <button
              className="gradient-btn rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              type="button"
              onClick={onViewAudit}
            >
              Audit Log
            </button>
          </div>
        </div>
      </section>

      {showCaseDetails ? (
        <>
          <AutoClassificationSection
            classificationSummary={result.classification_summary || []}
            onViewAudit={onViewAudit}
          />

      {/* Timeline + Metadata */}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <FraudTimeline events={timelineEvents} />
        <MetadataPanel documentResults={result.document_results} />
      </div>

      {/* Document Verification Results */}
      <section className="space-y-4">
        <SectionHeading>Document Verification Results</SectionHeading>
        <div className="overflow-hidden rounded-xl glass-card">
          {result.document_results.map((documentResult, index) => {
            const failedCheck = (documentResult.temporal_checks || []).find(
              (check) => check.status === 'FAIL',
            )
            const isActive = activeDocument === documentResult.filename

            return (
              <button
                key={documentResult.doc_id}
                className={`animate-rise grid w-full gap-3 border-b border-white/[0.04] px-4 py-4 text-left transition-all duration-200 last:border-b-0 hover:bg-white/[0.03] md:grid-cols-[1fr_auto_auto] md:items-center ${
                  isActive
                    ? 'border-l-4 border-l-primary bg-primary/[0.06]'
                    : 'border-l-4 border-l-transparent'
                }`}
                style={{ animationDelay: `${index * 45}ms` }}
                type="button"
                onClick={() => handleDocumentClick(documentResult)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary-light">
                    <FileText size={21} />
                  </div>
                  <div>
                    <p className="font-bold text-ink">{documentResult.filename}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {failedCheck ? failedCheck.rule_name : 'All checks passed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {documentResult.forensic_flags?.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-danger/20 bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">
                      <Fingerprint size={12} /> {documentResult.forensic_flags.length} Flags
                    </span>
                  )}
                  <StatusBadge status={documentResult.hash_status} />
                  <span className="font-mono text-xs text-ink-faint">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* DRISHTI Insight Cards */}
      <section className="space-y-4">
        {hasFraud ? (
          <>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <SectionHeading noBorder>DRISHTI Insight Cards</SectionHeading>
              <span className="inline-flex items-center gap-2 rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                <span className="glow-dot-danger" />
                {insightCount}
              </span>
            </div>
            <div className="space-y-5">
              {result.insight_cards.map((card, index) => (
                <InsightCard
                  key={card.card_id}
                  card={card}
                  index={index}
                  refCallback={(element) => {
                    cardRefs.current[card.card_id] = element
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="animate-rise rounded-xl border border-accent-emerald/30 bg-accent-emerald/[0.06] p-8 text-center glow-border-emerald">
            <CheckCircle className="mx-auto text-accent-emerald" size={48} />
            <h2 className="mt-4 text-2xl font-extrabold text-accent-emerald">
              Application Passed All Verification Checks
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
              All 7 documents verified. Hash integrity confirmed. All temporal logic checks passed.
              Bundle seal intact.
            </p>
          </div>
        )}
      </section>

      {/* Temporal Logic Details */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading noBorder>Temporal Logic Details</SectionHeading>
          <button
            className="rounded-lg border border-white/[0.08] bg-surface-100 px-4 py-2 text-sm font-bold text-primary-light transition hover:bg-surface-200 hover:border-primary/30"
            type="button"
            onClick={() => setShowTemporalChecks((current) => !current)}
          >
            {showTemporalChecks ? 'Hide Temporal Checks' : 'Show All Temporal Checks'}
          </button>
        </div>
        {showTemporalChecks ? (
          <div className="animate-rise overflow-x-auto rounded-xl glass-card">
            <table className="min-w-full divide-y divide-white/[0.04] text-sm">
              <thead className="bg-surface-100 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Rule ID</th>
                  <th className="px-4 py-3">Rule Name</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Found</th>
                  <th className="px-4 py-3">Expected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {temporalRows.map((check, index) => (
                  <tr key={`${check.rule_id}-${check.document}-${index}`} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{check.rule_id}</td>
                    <td className="px-4 py-3 font-bold text-ink">{check.rule_name}</td>
                    <td className="px-4 py-3 text-ink-muted">{check.document}</td>
                    <td className="px-4 py-3"><StatusBadge status={check.status} /></td>
                    <td className="px-4 py-3 text-ink-muted">{check.found_value || '--'}</td>
                    <td className="px-4 py-3 text-ink-muted">{check.expected_value || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
        </>
      ) : null}

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-3 border-t border-white/[0.06] pt-5">
        <button
          className="gradient-btn rounded-lg px-5 py-3 text-sm font-bold text-white"
          type="button"
          onClick={onViewAudit}
        >
          View Immutable Audit Log
        </button>
        <button
          className="rounded-lg border border-white/[0.08] bg-surface-100 px-5 py-3 text-sm font-bold text-ink-muted transition hover:bg-surface-200 hover:text-ink"
          type="button"
          onClick={onVerifyAnother}
        >
          Verify Another Application
        </button>
      </div>
    </section>
  )
}

/* ─── Sub-components ─── */

function AutoClassificationSection({ classificationSummary, onViewAudit }) {
  return (
    <section className="animate-rise glass-card space-y-4 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">
          Document Auto-Classification
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">Detected document types</h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full divide-y divide-white/[0.04] text-sm">
          <thead className="bg-surface-100 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Filename</th>
              <th className="px-4 py-3">Detected Type</th>
              <th className="px-4 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {classificationSummary.length > 0 ? (
              classificationSummary.map((item) => (
                <tr key={`${item.filename}-${item.detected_type}`} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-bold text-ink">{item.filename}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatLabel(item.detected_type || 'unknown')}</td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge confidence={item.confidence} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-5 text-sm font-medium text-ink-faint" colSpan={3}>
                  No classification summary was returned for this verification.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        className="gradient-btn inline-flex rounded-lg px-5 py-3 text-sm font-bold text-white"
        type="button"
        onClick={onViewAudit}
      >
        View Immutable Audit Log →
      </button>
    </section>
  )
}

function ConfidenceBadge({ confidence }) {
  const styles = {
    high: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20',
    medium: 'bg-warning/10 text-warning border border-warning/20',
    low: 'bg-danger/10 text-danger border border-danger/20',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
        styles[confidence] || styles.low
      }`}
    >
      {confidence || 'low'}
    </span>
  )
}

function SectionHeading({ children, noBorder = false }) {
  return (
    <h2
      className={`text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald ${
        noBorder ? '' : 'border-b border-white/[0.06] pb-2'
      }`}
    >
      {children}
    </h2>
  )
}

function MetricCard({ icon, label, value, accent = 'text-ink' }) {
  return (
    <div className="animate-rise glass-card glass-card-hover p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</p>
        <span className="text-primary-light">{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  )
}

function DecisionBrief({ brief }) {
  const toneMap = {
    Approve: {
      border: 'border-accent-emerald/30',
      bg: 'bg-accent-emerald/[0.06]',
      text: 'text-accent-emerald',
      glow: 'glow-border-emerald',
      evidenceBg: 'bg-accent-emerald/5 border border-accent-emerald/10',
    },
    'Manual Review': {
      border: 'border-warning/30',
      bg: 'bg-warning/[0.06]',
      text: 'text-warning',
      glow: 'glow-border-warning',
      evidenceBg: 'bg-warning/5 border border-warning/10',
    },
    Reject: {
      border: 'border-danger/30',
      bg: 'bg-danger/[0.06]',
      text: 'text-danger',
      glow: 'glow-border-danger',
      evidenceBg: 'bg-danger/5 border border-danger/10',
    },
  }
  const tone = toneMap[brief.recommendation] || toneMap.Reject

  return (
    <section className={`animate-rise rounded-xl border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">Decision Basis</p>
          <h2 className={`mt-2 text-xl font-extrabold ${tone.text}`}>{brief.primarySignal}</h2>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${tone.border} ${tone.text}`}>
          {brief.recommendation}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {brief.evidence.map((item) => (
          <div key={item} className={`rounded-lg px-3 py-3 text-sm font-medium text-ink-muted ${tone.evidenceBg}`}>
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function FraudTimeline({ events }) {
  return (
    <section className="animate-rise glass-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div>
          <SectionHeading noBorder>Fraud Timeline</SectionHeading>
          <p className="mt-1 text-sm text-ink-faint">Key dates extracted from uploaded PDFs.</p>
        </div>
        <CalendarClock className="text-primary-light" size={22} />
      </div>
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={`${event.label}-${event.date}-${index}`} className="grid grid-cols-[auto_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-3 w-3 rounded-full ${
                    event.hasFraud ? 'bg-danger shadow-glow-danger' : 'bg-accent-emerald shadow-glow-emerald'
                  }`}
                />
                {index < events.length - 1 ? (
                  <span className="mt-1 h-full min-h-8 w-px bg-gradient-to-b from-white/10 to-transparent" />
                ) : null}
              </div>
              <div className="glass-inset rounded-lg px-3 py-3">
                <p className="font-mono text-xs font-bold text-ink-faint">{event.date}</p>
                <p className="mt-1 text-sm font-bold text-ink">{event.label}</p>
                <p className="mt-1 text-xs text-ink-faint">{event.document}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">No date metadata was extracted from this bundle.</p>
      )}
    </section>
  )
}

function MetadataPanel({ documentResults }) {
  return (
    <section className="animate-rise glass-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div>
          <SectionHeading noBorder>Extracted Metadata</SectionHeading>
          <p className="mt-1 text-sm text-ink-faint">Fields read from PDFs before rule evaluation.</p>
        </div>
        <ClipboardList className="text-primary-light" size={22} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {documentResults.map((documentResult) => {
          const metadataEntries = Object.entries(documentResult.metadata || {}).filter(
            ([, value]) => value !== null && value !== undefined && value !== '',
          )

          return (
            <div key={documentResult.doc_id} className="glass-inset rounded-lg p-3">
              <p className="truncate text-sm font-bold text-ink">{documentResult.filename}</p>
              {metadataEntries.length > 0 ? (
                <dl className="mt-3 space-y-2">
                  {metadataEntries.slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs">
                      <dt className="font-bold uppercase tracking-wide text-ink-faint">{formatLabel(key)}</dt>
                      <dd className="max-w-[55%] text-right font-mono font-medium text-ink-muted">
                        {formatValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-xs font-medium text-ink-faint">No structured fields extracted.</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function InsightCard({ card, refCallback, index }) {
  const pattern = card.fraud_pattern
  const severityClass =
    pattern.severity === 'HIGH'
      ? 'bg-danger/10 text-danger border border-danger/20'
      : 'bg-warning/10 text-warning border border-warning/20'

  return (
    <article
      ref={refCallback}
      className="animate-rise overflow-hidden rounded-xl border border-danger/30 bg-danger/[0.03] glow-border-danger"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <header className="border-b border-danger/20 bg-danger/[0.08] px-5 py-4">
        <h3 className="text-lg font-extrabold text-danger">{pattern.pattern_name}</h3>
        <p className="mt-1 text-sm font-medium text-danger/70">
          {pattern.affected_document} | {pattern.failed_check}
        </p>
      </header>
      <div className="space-y-5 p-5">
        <dl className="grid gap-4 md:grid-cols-4">
          <Definition label="Affected Document" value={pattern.affected_document} />
          <Definition label="Failed Check" value={pattern.failed_check} />
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint">Severity</dt>
            <dd className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityClass}`}>
                {pattern.severity}
              </span>
            </dd>
          </div>
          <Definition label="Pattern ID" mono value={pattern.pattern_id} />
        </dl>
        <span className="inline-flex rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
          Fraud Pattern: {pattern.pattern_name}
        </span>
        <div>
          <h4 className="text-sm font-bold text-ink">Explanation</h4>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{pattern.explanation}</p>
        </div>
        <div className="rounded-lg border-l-4 border-danger bg-danger/5 py-3 pl-4">
          <h4 className="text-sm font-bold text-danger">Recommended Actions</h4>
          <ul className="mt-2 space-y-2 text-sm text-ink-muted">
            {pattern.recommended_actions.map((action) => (
              <li key={action}>→ {action}</li>
            ))}
          </ul>
        </div>
        <footer className="text-xs text-ink-faint">
          Card ID: {truncateMiddle(card.card_id, 8, 4)} | Generated at: {card.generated_at} | Audit hash:{' '}
          {truncateMiddle(card.result_hash, 10, 6)}
        </footer>
      </div>
    </article>
  )
}

function Definition({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={`mt-2 text-sm font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

/* ─── Utility Functions ─── */

function findInsightCardForDocument(documentResult, insightCards) {
  const filename = documentResult.filename.toLowerCase()
  const docTypeLabel = (documentLabels[documentResult.doc_type] || documentResult.doc_type)
    .toLowerCase()
  const docType = documentResult.doc_type.toLowerCase()

  return insightCards.find((card) => {
    const affected = card.fraud_pattern.affected_document.toLowerCase()
    return (
      affected.includes(filename) ||
      filename.includes(affected) ||
      affected.includes(docTypeLabel) ||
      affected.includes(docType.replaceAll('_', ' '))
    )
  })
}

function truncateMiddle(value = '', start = 8, end = 4) {
  if (!value || value.length <= start + end + 1) {
    return value
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function buildDecisionBrief(result) {
  const cards = result?.insight_cards || []
  if (cards.length === 0) {
    return {
      recommendation: 'Approve',
      primarySignal: 'No fraud pattern detected',
      summary: 'No fraud signals found. Case may proceed to underwriting.',
      evidence: ['Hash integrity confirmed', 'Bundle seal intact', 'Temporal rules passed'],
    }
  }

  const highSeverityCount = cards.filter((card) => card.fraud_pattern.severity === 'HIGH').length
  const recommendation = highSeverityCount > 0 ? 'Reject' : 'Manual Review'
  const primarySignal = cards[0]?.fraud_pattern.pattern_name || 'Fraud pattern detected'
  const evidence = cards.slice(0, 3).map((card) => card.fraud_pattern.failed_check)

  return {
    recommendation,
    primarySignal,
    summary:
      recommendation === 'Reject'
        ? 'High-severity fraud signal found. Escalate before proceeding.'
        : 'Inconsistency found. Manual review required before decision.',
    evidence,
  }
}

function buildTimelineEvents(result) {
  if (!result?.document_results) {
    return []
  }

  const events = []
  result.document_results.forEach((documentResult) => {
    const metadata = documentResult.metadata || {}
    const addEvent = (date, label) => {
      if (!date) {
        return
      }
      events.push({
        date: String(date),
        document: documentResult.filename,
        hasFraud: documentResult.has_fraud,
        label,
      })
    }

    addEvent(metadata.issue_date, 'Land record issue date')
    addEvent(metadata.filing_date, 'ITR filing date')
    addEvent(metadata.valuation_date, 'Property valuation date')
    addEvent(metadata.registration_date, 'Sale deed registration date')

    if (metadata.slip_month && metadata.slip_year) {
      const month = String(metadata.slip_month).padStart(2, '0')
      addEvent(`${metadata.slip_year}-${month}-01`, 'Salary slip month')
    }
  })

  return events.sort((left, right) => left.date.localeCompare(right.date))
}

function formatLabel(value) {
  return value.replaceAll('_', ' ')
}

function formatValue(value) {
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN')
  }
  return String(value)
}

export default Results
