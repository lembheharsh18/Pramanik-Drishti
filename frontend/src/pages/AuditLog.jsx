import { ChevronDown, Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getAuditLog } from '../api/client.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const eventBadgeStyles = {
  HASH_CHECK: 'bg-primary/10 text-primary-light border border-primary/20',
  TEMPORAL_CHECK: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20',
  BUNDLE_CHECK: 'bg-warning/10 text-warning border border-warning/20',
  INSIGHT_CARD_GENERATED: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

function AuditLog({ bundleId, onBackToResults }) {
  const [entries, setEntries] = useState([])
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAuditLog() {
      if (!bundleId) {
        setError('Bundle ID is missing.')
        setIsLoading(false)
        return
      }

      try {
        const response = await getAuditLog(bundleId)
        if (isMounted) {
          setEntries(response.data)
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.detail || apiError.message || 'Failed to load audit log.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAuditLog()

    return () => {
      isMounted = false
    }
  }, [bundleId])

  return (
    <section className="space-y-6">
      <div className="animate-rise glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-emerald/10 text-accent-emerald shadow-glow-emerald">
            <ShieldCheck size={25} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">Audit</p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink">Immutable Audit Log</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Tamper-proof verification history written before human review.
            </p>
            <p className="mt-1 break-all font-mono text-xs text-ink-faint">Bundle ID: {bundleId}</p>
          </div>
        </div>
      </div>

      <div className="animate-rise-delay-1 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 p-4 text-sm leading-6 text-accent-emerald">
        Every entry below was written before the verification result returned to the underwriter.
        Each row includes a SHA-256 hash of its own content, so any modified entry becomes detectable.
      </div>

      {isLoading ? <LoadingSpinner message="Loading immutable audit log..." /> : null}

      {error ? (
        <div className="animate-rise rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="relative space-y-3">
          {/* Timeline connector */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-accent-emerald/20 to-transparent md:block" />

          {entries.map((entry, index) => (
            <div
              key={`${entry.created_at}-${index}`}
              className="animate-rise relative glass-card overflow-hidden"
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <button
                className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[auto_1fr_auto_auto] md:items-center"
                type="button"
                onClick={() => setExpandedIndex((current) => (current === index ? null : index))}
              >
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent-emerald/20 bg-surface-100 text-accent-emerald">
                  <Lock size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${eventBadgeStyles[entry.event_type] || 'bg-surface-200 text-ink-muted border border-white/[0.06]'}`}>
                      {entry.event_type}
                    </span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="mt-2 font-bold text-ink">{entry.document_name || 'All documents'}</p>
                  <span className="mt-1 block font-mono text-xs text-ink-faint">{entry.created_at}</span>
                </div>
                <p className="text-right font-mono text-[11px] text-ink-faint">
                  sha256: {entry.result_hash.slice(0, 8)}...{entry.result_hash.slice(-4)}
                </p>
                <ChevronDown
                  className={`text-ink-faint transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`}
                  size={18}
                />
              </button>
              {expandedIndex === index ? (
                <pre className="overflow-x-auto border-t border-white/[0.04] bg-surface-50 p-4 text-xs leading-5 text-ink-muted">
                  {JSON.stringify(entry.detail, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <button
        className="inline-flex rounded-lg border border-white/[0.08] bg-surface-100 px-5 py-3 text-sm font-bold text-primary-light transition hover:bg-surface-200 hover:border-primary/30"
        type="button"
        onClick={onBackToResults}
      >
        ← Back to Results
      </button>
    </section>
  )
}

export default AuditLog
