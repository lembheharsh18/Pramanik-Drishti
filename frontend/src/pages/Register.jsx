import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileArchive,
  Files,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { registerBundle, registerBundleZip } from '../api/client.js'
import DocumentUploadGrid from '../components/DocumentUploadGrid.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { VERIFICATION_TYPES } from '../components/VerificationTypeSelector.jsx'
import { DOCUMENT_FIELDS, createEmptyFileState } from '../constants/documents.js'

function Register({ onRegistered, onSkip }) {
  const [uploadMode, setUploadMode] = useState('zip')
  const [verificationType, setVerificationType] = useState('home_loan')
  const [zipFile, setZipFile] = useState(null)
  const [applicantId, setApplicantId] = useState('')
  const [files, setFiles] = useState(createEmptyFileState)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const selectedCount = useMemo(
    () => DOCUMENT_FIELDS.filter((field) => files[field.key]).length,
    [files],
  )
  const displayedCount = uploadMode === 'zip' ? (zipFile ? 1 : 0) : selectedCount
  const totalCount = uploadMode === 'zip' ? 1 : DOCUMENT_FIELDS.length

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

    const formData = new FormData()
    formData.append('applicant_id', applicantId.trim())

    if (uploadMode === 'zip') {
      if (!zipFile) {
        setError('Please upload a ZIP archive.')
        return
      }

      formData.append('zip_file', zipFile)
      formData.append('verification_type', verificationType)
    } else {
      const missingFile = DOCUMENT_FIELDS.find((field) => !files[field.key])
      if (missingFile) {
        setError(`Please upload ${missingFile.label}.`)
        return
      }

      DOCUMENT_FIELDS.forEach((field) => {
        formData.append(field.key, files[field.key])
      })
    }

    setIsLoading(true)
    try {
      const response =
        uploadMode === 'zip' ? await registerBundleZip(formData) : await registerBundle(formData)
      setResult(response.data)
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'Bundle registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      {onSkip ? (
        <div className="flex justify-end">
          <button
            className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary-light transition hover:border-primary/50 hover:bg-primary/20"
            type="button"
            onClick={onSkip}
          >
            I already have a Bundle ID
          </button>
        </div>
      ) : null}

      <PageHero
        count={displayedCount}
        subtitle="Simulate issuance and seal every uploaded file with cryptographic proof."
        title="Register Application Bundle"
        total={totalCount}
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

          {uploadMode === 'zip' ? (
            <div className="animate-rise glass-card p-5">
              <label className="text-sm font-bold text-ink" htmlFor="registration-type">
                Registration Type
              </label>
              <select
                className="mt-2 w-full rounded-lg border border-white/[0.08] bg-surface-100 px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                id="registration-type"
                value={verificationType}
                onChange={(event) => setVerificationType(event.target.value)}
              >
                {Object.entries(VERIFICATION_TYPES).map(([type, verification]) => (
                  <option key={type} value={type}>
                    {verification.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs font-medium text-ink-faint">
                Used to match classified PDF files to expected document slots.
              </p>
            </div>
          ) : null}

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

          {result ? <SuccessCard result={result} onUseBundle={onRegistered} /> : null}
        </aside>

        <div className="space-y-5">
          <UploadModeTabs
            uploadMode={uploadMode}
            onChange={(mode) => {
              setUploadMode(mode)
              setError(null)
              setResult(null)
            }}
          />

          {uploadMode === 'zip' ? (
            <ZipRegistrationPicker zipFile={zipFile} onZipFileChange={setZipFile} />
          ) : (
            <DocumentUploadGrid files={files} onFileChange={handleFileChange} />
          )}

          {isLoading ? (
            <LoadingSpinner message="Registering bundle and storing hashes..." />
          ) : (
            <button
              className="gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white"
              type="submit"
            >
              Register {uploadMode === 'zip' ? 'ZIP' : 'Bundle'} & Store Hashes <ShieldCheck size={18} />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function UploadModeTabs({ uploadMode, onChange }) {
  return (
    <div className="flex rounded-lg border border-white/[0.08] bg-surface-100 p-1">
      <button
        className={`flex-1 rounded-md py-2.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
          uploadMode === 'zip' ? 'bg-surface text-primary shadow' : 'text-ink-muted hover:text-ink'
        }`}
        type="button"
        onClick={() => onChange('zip')}
      >
        <FileArchive size={16} /> ZIP Archive
      </button>
      <button
        className={`flex-1 rounded-md py-2.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
          uploadMode === 'individual'
            ? 'bg-surface text-primary shadow'
            : 'text-ink-muted hover:text-ink'
        }`}
        type="button"
        onClick={() => onChange('individual')}
      >
        <Files size={16} /> Individual PDFs
      </button>
    </div>
  )
}

function ZipRegistrationPicker({ zipFile, onZipFileChange }) {
  return (
    <label
      className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
        zipFile
          ? 'border-accent-emerald/40 bg-accent-emerald/5 glow-border-emerald'
          : 'border-white/[0.1] bg-surface-50 hover:border-primary/40 hover:bg-primary/[0.04]'
      }`}
    >
      <input
        accept=".zip,application/zip,application/x-zip-compressed"
        className="sr-only"
        type="file"
        onChange={(event) => onZipFileChange(event.target.files?.[0] || null)}
      />
      {zipFile ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-emerald text-surface shadow-glow-emerald">
            <CheckCircle2 size={30} />
          </div>
          <p className="mt-4 text-lg font-extrabold text-ink">{zipFile.name}</p>
          <p className="mt-2 text-sm font-medium text-ink-muted">
            This archive will be classified and sealed as one bundle.
          </p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary-light">
            <UploadCloud size={31} />
          </div>
          <p className="mt-4 text-lg font-extrabold text-ink">
            Click to choose a ZIP archive
          </p>
          <p className="mt-2 text-sm font-medium text-ink-muted">
            Include the required PDF documents in one ZIP file.
          </p>
        </>
      )}
    </label>
  )
}

function PageHero({ title, subtitle, count, total }) {
  return (
    <div className="animate-rise glass-card flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">Issuance</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-right">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-light">Documents ready</p>
        <p className="mt-1 text-2xl font-extrabold text-primary-light">{count} / {total}</p>
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

function SuccessCard({ result, onUseBundle }) {
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
      {onUseBundle ? (
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-emerald px-4 py-3 text-sm font-bold text-surface transition hover:bg-accent-emerald/90"
          type="button"
          onClick={() => onUseBundle(result)}
        >
          Continue with this bundle <ArrowRight size={18} />
        </button>
      ) : null}
    </div>
  )
}

export default Register
