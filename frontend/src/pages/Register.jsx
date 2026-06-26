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
          <div className="animate-rise glass-card p-5">
            <label className="text-sm font-bold text-ink" htmlFor="applicant-id">
              Applicant ID
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-surface-100 px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
              id="applicant-id"
              placeholder="e.g. APP-2024-001"
              type="text"
              value={applicantId}
              onChange={(event) => setApplicantId(event.target.value)}
            />
          </div>

          <div className="animate-rise-delay-1 glass-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">
              Issuance Pipeline
            </p>
            <div className="mt-4 space-y-3">
              <PipelineStep icon={<Fingerprint size={18} />} text="Compute SHA-256 for every file" />
              <PipelineStep icon={<Database size={18} />} text="Store metadata and hash registry" />
              <PipelineStep icon={<KeyRound size={18} />} text="Build Merkle root bundle seal" />
            </div>
          </div>

          {error ? (
            <div className="animate-rise rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-bold text-danger">
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
              className="gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white"
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
    <div className="animate-rise glass-card flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">Issuance</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-right">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-light">Documents ready</p>
        <p className="mt-1 text-2xl font-extrabold text-primary-light">{count} / 7</p>
      </div>
    </div>
  )
}

function PipelineStep({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-100 px-3 py-3 text-sm font-medium text-ink-muted">
      <span className="text-primary-light">{icon}</span>
      {text}
    </div>
  )
}

function SuccessCard({ result }) {
  return (
    <div className="animate-rise rounded-xl border border-accent-emerald/30 bg-accent-emerald/[0.06] p-5 glow-border-emerald">
      <p className="text-sm font-bold text-accent-emerald">Bundle sealed successfully.</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-ink-faint">Bundle ID</dt>
          <dd className="mt-1 break-all font-mono text-ink">{result.bundle_id}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-faint">Merkle Root</dt>
          <dd className="mt-1 font-mono text-ink">{result.merkle_root?.slice(0, 16)}...</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm font-bold text-accent-emerald">Save this Bundle ID for verification.</p>
    </div>
  )
}

export default Register
