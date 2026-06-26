import { ChevronDown, Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getAuditLog } from '../api/client.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const eventBadgeStyles = {
  HASH_CHECK: 'bg-indigo-50 text-[#2D1B8E]',
  TEMPORAL_CHECK: 'bg-emerald-50 text-[#0F6E56]',
  BUNDLE_CHECK: 'bg-[#FFF8EC] text-[#854F0B]',
  INSIGHT_CARD_GENERATED: 'bg-purple-50 text-purple-700',
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
      <div className="animate-rise rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-[#0F6E56]">
            <ShieldCheck size={25} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">Audit</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Immutable Audit Log</h1>
            <p className="mt-2 text-sm text-slate-600">
              Tamper-proof verification history written before human review.
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">Bundle ID: {bundleId}</p>
          </div>
        </div>
      </div>

      <div className="animate-rise-delay-1 rounded-lg border border-[#0F6E56] bg-emerald-50 p-4 text-sm leading-6 text-[#085041]">
        Every entry below was written before the verification result returned to the underwriter.
        Each row includes a SHA-256 hash of its own content, so any modified entry becomes detectable.
      </div>

      {isLoading ? <LoadingSpinner message="Loading immutable audit log..." /> : null}

      {error ? (
        <div className="animate-rise rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-[#A32D2D]">
          {error}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="relative space-y-3">
          <div className="absolute left-6 top-0 hidden h-full w-px bg-slate-200 md:block" />
          {entries.map((entry, index) => (
            <div
              key={`${entry.created_at}-${index}`}
              className="animate-rise relative rounded-lg border border-slate-200 bg-white shadow-sm"
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <button
                className="grid w-full gap-3 px-4 py-4 text-left md:grid-cols-[auto_1fr_auto_auto] md:items-center"
                type="button"
                onClick={() => setExpandedIndex((current) => (current === index ? null : index))}
              >
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-[#0F6E56]">
                  <Lock size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${eventBadgeStyles[entry.event_type] || 'bg-slate-100 text-slate-700'}`}>
                      {entry.event_type}
                    </span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="mt-2 font-black text-slate-950">{entry.document_name || 'All documents'}</p>
                  <span className="mt-1 block font-mono text-xs text-slate-500">{entry.created_at}</span>
                </div>
                <p className="text-right font-mono text-[11px] text-slate-500">
                  sha256: {entry.result_hash.slice(0, 8)}...{entry.result_hash.slice(-4)}
                </p>
                <ChevronDown
                  className={`text-slate-400 transition ${expandedIndex === index ? 'rotate-180' : ''}`}
                  size={18}
                />
              </button>
              {expandedIndex === index ? (
                <pre className="overflow-x-auto border-t border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
                  {JSON.stringify(entry.detail, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <button
        className="inline-flex rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#2D1B8E] shadow-sm"
        type="button"
        onClick={onBackToResults}
      >
        Back to Results
      </button>
    </section>
  )
}

export default AuditLog
