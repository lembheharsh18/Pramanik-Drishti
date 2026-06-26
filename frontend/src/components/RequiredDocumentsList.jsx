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
        className="inline-flex items-center gap-2 text-sm font-black text-[#2D1B8E] transition hover:text-indigo-950"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Change Type
      </button>

      <div className="animate-rise rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">
              Document checklist
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Documents required for {verificationLabel}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Prepare the following documents as PDFs before uploading
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-[#2D1B8E] bg-white px-4 py-2 text-sm font-black text-[#2D1B8E] shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50"
            type="button"
            onClick={handleSelectAll}
          >
            <CheckCircle2 size={17} />
            Select All
          </button>
        </div>

        <div className="mt-6 rounded-lg border-l-4 border-[#0F6E56] bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          All documents must be in PDF format. Scanned documents are accepted. The system will
          automatically identify each document from its content — no manual labeling required.
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-800">
              {readyCount} of {totalCount} documents ready
            </p>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${isComplete ? 'text-[#0F6E56]' : 'text-[#2D1B8E]'}`}>
              {progressPercent}% complete
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? 'bg-[#0F6E56]' : 'bg-[#2D1B8E]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {documents.map((document, index) => {
            const isChecked = Boolean(checkedDocuments[document.id])

            return (
              <label
                key={document.id}
                className={`flex cursor-pointer items-center gap-4 p-4 transition hover:bg-indigo-50/50 ${
                  isChecked ? 'bg-emerald-50/70' : 'bg-white'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D1B8E] text-sm font-black text-white">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">{document.label}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                    {document.description}
                  </span>
                </span>
                <input
                  checked={isChecked}
                  className="h-5 w-5 shrink-0 rounded border-slate-300 text-[#2D1B8E] focus:ring-[#2D1B8E]"
                  type="checkbox"
                  onChange={() => handleToggle(document.id)}
                />
              </label>
            )
          })}
        </div>

        <div className="mt-7 flex justify-end">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2D1B8E] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950 sm:w-auto"
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
