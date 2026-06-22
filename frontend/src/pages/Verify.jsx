import { Activity, FileSearch, Fingerprint, GitBranch, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { runCleanDemo, runFraudDemo, verifyBundle } from '../api/client.js'
import DocumentUploadGrid from '../components/DocumentUploadGrid.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { DOCUMENT_FIELDS, createEmptyFileState } from '../constants/documents.js'

const loadingMessages = [
  'Running cryptographic hash verification...',
  'Executing temporal logic rules...',
  'Verifying Merkle bundle seal...',
  'Generating DRISHTI Insight Cards...',
]

function Verify() {
  const navigate = useNavigate()
  const [applicantId, setApplicantId] = useState('')
  const [bundleId, setBundleId] = useState('')
  const [files, setFiles] = useState(createEmptyFileState)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)
  const [error, setError] = useState(null)
  const [demoLoading, setDemoLoading] = useState(null)

  const selectedCount = useMemo(
    () => DOCUMENT_FIELDS.filter((field) => files[field.key]).length,
    [files],
  )

  useEffect(() => {
    if (!isLoading) {
      setLoadingIndex(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingMessages.length)
    }, 800)

    return () => window.clearInterval(intervalId)
  }, [isLoading])

  const handleFileChange = (key, file) => {
    setFiles((current) => ({
      ...current,
      [key]: file,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (!applicantId.trim()) {
      setError('Applicant ID is required.')
      return
    }

    if (!bundleId.trim()) {
      setError('Bundle ID is required.')
      return
    }

    const missingFile = DOCUMENT_FIELDS.find((field) => !files[field.key])
    if (missingFile) {
      setError(`Please upload ${missingFile.label}.`)
      return
    }

    const formData = new FormData()
    formData.append('applicant_id', applicantId.trim())
    formData.append('bundle_id', bundleId.trim())
    DOCUMENT_FIELDS.forEach((field) => {
      formData.append(field.key, files[field.key])
    })

    setIsLoading(true)
    try {
      const response = await verifyBundle(formData)
      navigate(`/results/${response.data.bundle_id}`, { state: response.data })
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'Verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoRun = async (type) => {
    setError(null)
    setDemoLoading(type)

    try {
      const response = type === 'clean' ? await runCleanDemo() : await runFraudDemo()
      const verification = response.data.verification
      navigate(`/results/${verification.bundle_id}`, { state: verification })
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'Demo run failed.')
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="animate-rise flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">Verification</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Verify Application Bundle</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Submit issued documents and watch PRAMANIK-DRISHTI expose tampering, swaps, and impossible timelines.
          </p>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2D1B8E]">Documents ready</p>
          <p className="mt-1 text-2xl font-black text-[#2D1B8E]">{selectedCount} / 7</p>
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]" onSubmit={handleSubmit}>
        <aside className="space-y-4">
          <div className="animate-rise rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <InputField
                id="verify-applicant-id"
                label="Applicant ID"
                placeholder="e.g. APP-2024-001"
                value={applicantId}
                onChange={setApplicantId}
              />
              <InputField
                id="bundle-id"
                label="Bundle ID"
                placeholder="Bundle ID from registration step"
                value={bundleId}
                onChange={setBundleId}
              />
            </div>
          </div>

          <div className="animate-rise-delay-1 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">
              Live Check Sequence
            </p>
            <div className="mt-4 space-y-3">
              <PipelineStep icon={<Fingerprint size={18} />} text="Hash integrity" />
              <PipelineStep icon={<FileSearch size={18} />} text="Temporal fraud rules" />
              <PipelineStep icon={<GitBranch size={18} />} text="Merkle bundle seal" />
              <PipelineStep icon={<Sparkles size={18} />} text="DRISHTI insight cards" />
            </div>
          </div>

          <div className="animate-rise-delay-2 rounded-lg border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2D1B8E]">
              One-click demo
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Launch a complete sample verification without manually uploading PDFs.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                className="rounded-md bg-[#0F6E56] px-4 py-2 text-sm font-black text-white"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('clean')}
              >
                Run Clean Demo
              </button>
              <button
                className="rounded-md bg-[#A32D2D] px-4 py-2 text-sm font-black text-white"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('fraud')}
              >
                Run Fraud Demo
              </button>
            </div>
            {demoLoading ? (
              <p className="mt-3 animate-soft-pulse text-sm font-black text-[#2D1B8E]">
                Running {demoLoading} demo...
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="animate-rise rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-[#A32D2D]">
              {error}
            </div>
          ) : null}
        </aside>

        <div className="space-y-5">
          <DocumentUploadGrid files={files} onFileChange={handleFileChange} />

          {isLoading ? (
            <LoadingSpinner message={loadingMessages[loadingIndex]} />
          ) : (
            <button
              className="scanline inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2D1B8E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950"
              type="submit"
            >
              Run PRAMANIK-DRISHTI Verification <Activity size={18} />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function InputField({ id, label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-black text-slate-800" htmlFor={id}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2D1B8E] focus:ring-2 focus:ring-indigo-100"
        id={id}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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

export default Verify
