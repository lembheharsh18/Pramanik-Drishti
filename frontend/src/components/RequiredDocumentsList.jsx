import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { VERIFICATION_TYPES } from './VerificationTypeSelector.jsx'

function RequiredDocumentsList({ verificationType, documents, onProceed, onBack }) {
  const [checkedDocuments, setCheckedDocuments] = useState({})
  const verificationLabel = VERIFICATION_TYPES[verificationType]?.label || verificationType
  const readyCount = useMemo(
    () => documents.filter((document) => checkedDocuments[document.id]).length,
    [checkedDocuments, documents],
  )
  const totalCount = documents.length
  const progressPercent = totalCount ? Math.round((readyCount / totalCount) * 100) : 0
  const isComplete = totalCount > 0 && readyCount === totalCount

  const handleToggle = (documentId) => {
    setCheckedDocuments((current) => ({
      ...current,
      [documentId]: !current[documentId],
    }))
  }

  const handleSelectAll = () => {
    setCheckedDocuments(
      documents.reduce((state, document) => {
        state[document.id] = true
        return state
      }, {}),
    )
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-4">
      <button
        className="inline-flex items-center gap-2 text-sm font-bold text-primary-light transition hover:text-primary"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Change Type
      </button>

      <div className="animate-rise glass-card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">
              Document checklist
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink">
              Documents required for {verificationLabel}
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-ink-muted">
              Prepare the following documents as PDFs before uploading
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary-light transition hover:bg-primary/20 hover:border-primary/50"
            type="button"
            onClick={handleSelectAll}
          >
            <CheckCircle2 size={17} />
            Select All
          </button>
        </div>

        <div className="mt-6 rounded-lg border-l-4 border-accent-emerald bg-accent-emerald/5 px-4 py-3 text-sm font-medium leading-6 text-ink-muted">
          All documents must be in PDF format. Scanned documents are accepted. The system will
          automatically identify each document from its content — no manual labeling required.
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-ink">
              {readyCount} of {totalCount} documents ready
            </p>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isComplete ? 'text-accent-emerald' : 'text-primary-light'}`}>
              {progressPercent}% complete
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-300">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-gradient-to-r from-accent-emerald to-accent-emerald-dark'
                  : 'bg-gradient-to-r from-primary to-primary-light'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-white/[0.06] bg-surface-50">
          {documents.map((document, index) => {
            const isChecked = Boolean(checkedDocuments[document.id])

            return (
              <label
                key={document.id}
                className={`flex cursor-pointer items-center gap-4 p-4 transition-all duration-200 hover:bg-primary/[0.06] ${
                  isChecked ? 'bg-accent-emerald/[0.06]' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    isChecked
                      ? 'bg-accent-emerald text-surface shadow-glow-emerald'
                      : 'bg-primary/15 text-primary-light'
                  }`}
                >
                  {isChecked ? <CheckCircle2 size={18} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{document.label}</span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-ink-faint">
                    {document.description}
                  </span>
                </span>
                <input
                  checked={isChecked}
                  className="h-5 w-5 shrink-0 rounded border-white/20 bg-surface-200 text-primary focus:ring-primary focus:ring-offset-surface"
                  type="checkbox"
                  onChange={() => handleToggle(document.id)}
                />
              </label>
            )
          })}
        </div>

        <div className="mt-7 flex justify-end">
          <button
            className="gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white sm:w-auto"
            type="button"
            onClick={onProceed}
          >
            Upload Documents <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default RequiredDocumentsList
