import { Database, Fingerprint, KeyRound, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

import { registerBundle } from '../api/client.js'
import DocumentUploadGrid from '../components/DocumentUploadGrid.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { DOCUMENT_FIELDS, createEmptyFileState } from '../constants/documents.js'

function Register() {
  const [applicantId, setApplicantId] = useState('')
  const [files, setFiles] = useState(createEmptyFileState)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const selectedCount = useMemo(
    () => DOCUMENT_FIELDS.filter((field) => files[field.key]).length,
    [files],
  )

  const handleFileChange = (key, file) => {
    setFiles((current) => ({
      ...current,
      [key]: file,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setResult(null)

    if (!applicantId.trim()) {
      setError('Applicant ID is required.')
      return
    }

    const missingFile = DOCUMENT_FIELDS.find((field) => !files[field.key])
    if (missingFile) {
      setError(`Please upload ${missingFile.label}.`)
      return
    }

    const formData = new FormData()
    formData.append('applicant_id', applicantId.trim())
    DOCUMENT_FIELDS.forEach((field) => {
      formData.append(field.key, files[field.key])
    })

    setIsLoading(true)
    try {
      const response = await registerBundle(formData)
      setResult(response.data)
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'Bundle registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <PageHero
        count={selectedCount}
        subtitle="Simulate issuance and seal every uploaded file with cryptographic proof."
        title="Register Application Bundle"
      />

      <form className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]" onSubmit={handleSubmit}>
        <aside className="space-y-4">
          <div className="animate-rise rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-black text-slate-800" htmlFor="applicant-id">
              Applicant ID
            </label>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2D1B8E] focus:ring-2 focus:ring-indigo-100"
              id="applicant-id"
              placeholder="e.g. APP-2024-001"
              type="text"
              value={applicantId}
              onChange={(event) => setApplicantId(event.target.value)}
            />
          </div>

          <div className="animate-rise-delay-1 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">
              Issuance Pipeline
            </p>
            <div className="mt-4 space-y-3">
              <PipelineStep icon={<Fingerprint size={18} />} text="Compute SHA-256 for every file" />
              <PipelineStep icon={<Database size={18} />} text="Store metadata and hash registry" />
              <PipelineStep icon={<KeyRound size={18} />} text="Build Merkle root bundle seal" />
            </div>
          </div>

          {error ? (
            <div className="animate-rise rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-[#A32D2D]">
              {error}
            </div>
          ) : null}

          {result ? <SuccessCard result={result} /> : null}
        </aside>

        <div className="space-y-5">
          <DocumentUploadGrid files={files} onFileChange={handleFileChange} />

          {isLoading ? (
            <LoadingSpinner message="Registering bundle and storing hashes..." />
          ) : (
            <button
              className="scanline inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2D1B8E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950"
              type="submit"
            >
              Register Bundle & Store Hashes <ShieldCheck size={18} />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function PageHero({ title, subtitle, count }) {
  return (
    <div className="animate-rise flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">Issuance</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-right">
        <p className="text-xs font-bold uppercase tracking-wide text-[#2D1B8E]">Documents ready</p>
        <p className="mt-1 text-2xl font-black text-[#2D1B8E]">{count} / 7</p>
      </div>
    </div>
  )
}

function PipelineStep({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">
      <span className="text-[#2D1B8E]">{icon}</span>
      {text}
    </div>
  )
}

function SuccessCard({ result }) {
  return (
    <div className="animate-rise rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <p className="text-sm font-black text-[#085041]">Bundle sealed successfully.</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-bold text-slate-500">Bundle ID</dt>
          <dd className="mt-1 break-all font-mono text-slate-950">{result.bundle_id}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">Merkle Root</dt>
          <dd className="mt-1 font-mono text-slate-950">{result.merkle_root?.slice(0, 16)}...</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm font-black text-[#085041]">Save this Bundle ID for verification.</p>
    </div>
  )
}

export default Register
