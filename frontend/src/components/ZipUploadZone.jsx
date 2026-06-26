import { ArrowRight, CheckCircle2, FileArchive, Loader2, Files } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { verifyBundle, verifyBundleZip } from '../api/client.js'
import DocumentUploadGrid from './DocumentUploadGrid.jsx'

const progressMessages = [
  'Extracting documents from ZIP...',
  'Identifying document types automatically...',
  'Running cryptographic hash verification...',
  'Executing temporal logic rules...',
  'Verifying Merkle bundle seal...',
  'Generating DRISHTI Insight Cards...',
  'Writing to immutable audit log...',
]

function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) {
    return '0 KB'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), units.length - 1)
  const size = sizeInBytes / 1024 ** unitIndex

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function ZipUploadZone({
  verificationType,
  requiredDocuments,
  onUploadComplete,
  bundleId = '',
  applicantId = '',
  demoMode = false,
}) {
  const [uploadMode, setUploadMode] = useState('zip') // 'zip' or 'individual'
  const [zipFile, setZipFile] = useState(null)
  
  // Initialize individual files state based on required documents
  const [files, setFiles] = useState(() => {
    const initialState = {}
    requiredDocuments.forEach((doc) => {
      initialState[doc.id] = null
    })
    return initialState
  })

  const [applicantIdValue, setApplicantIdValue] = useState(applicantId)
  const [bundleIdValue, setBundleIdValue] = useState(bundleId)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    setApplicantIdValue(applicantId)
  }, [applicantId])

  useEffect(() => {
    setBundleIdValue(bundleId)
  }, [bundleId])

  useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveStepIndex((current) => Math.min(current + 1, progressMessages.length - 1))
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [isLoading])

  const onDrop = useCallback((acceptedFiles) => {
    setError(null)
    setZipFile(acceptedFiles[0] || null)
  }, [])

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxFiles: 1,
    multiple: false,
    onDrop,
  })
  
  const handleFileChange = (key, file) => {
    setFiles((current) => ({
      ...current,
      [key]: file,
    }))
  }

  const canSubmitZip = Boolean(zipFile && applicantIdValue.trim() && bundleIdValue.trim() && !isLoading)
  const canSubmitIndividual = Boolean(
    requiredDocuments.every((doc) => files[doc.id]) && 
    applicantIdValue.trim() && 
    bundleIdValue.trim() && 
    !isLoading
  )

  const canSubmit = uploadMode === 'zip' ? canSubmitZip : canSubmitIndividual

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      if (uploadMode === 'zip') {
        const formData = new FormData()
        formData.append('zip_file', zipFile)
        formData.append('applicant_id', applicantIdValue.trim())
        formData.append('bundle_id', bundleIdValue.trim())
        formData.append('verification_type', verificationType)

        const response = await verifyBundleZip(formData)
        onUploadComplete(response.data)
      } else {
        const formData = new FormData()
        formData.append('applicant_id', applicantIdValue.trim())
        formData.append('bundle_id', bundleIdValue.trim())
        
        requiredDocuments.forEach((doc) => {
          formData.append(doc.id, files[doc.id])
        })

        const response = await verifyBundle(formData)
        onUploadComplete(response.data)
      }
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'Verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-rise glass-card space-y-5 p-6">
      {demoMode ? (
        <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-bold text-warning">
          Drop your Bundle B (fraudulent) zip file to see fraud detection in action
        </div>
      ) : null}

      <div className="flex rounded-lg border border-white/[0.08] bg-surface-100 p-1">
        <button
          className={`flex-1 rounded-md py-2.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            uploadMode === 'zip'
              ? 'bg-surface text-primary shadow'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setUploadMode('zip')}
          type="button"
        >
          <FileArchive size={16} /> ZIP Archive
        </button>
        <button
          className={`flex-1 rounded-md py-2.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            uploadMode === 'individual'
              ? 'bg-surface text-primary shadow'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setUploadMode('individual')}
          type="button"
        >
          <Files size={16} /> Individual Files
        </button>
      </div>

      {uploadMode === 'zip' ? (
        <div
          {...getRootProps()}
          className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
            isDragActive
              ? 'border-primary bg-primary/10 glow-border-primary'
              : zipFile
                ? 'border-accent-emerald/40 bg-accent-emerald/5 glow-border-emerald'
                : 'border-white/[0.1] bg-surface-50 hover:border-primary/40 hover:bg-primary/[0.04]'
          }`}
        >
          <input {...getInputProps({ accept: '.zip' })} />
          {zipFile ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-emerald text-surface shadow-glow-emerald">
                <CheckCircle2 size={30} />
              </div>
              <p className="mt-4 text-lg font-extrabold text-ink">{zipFile.name}</p>
              <p className="mt-1 text-sm font-medium text-ink-muted">{formatFileSize(zipFile.size)}</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary-light">
                <FileArchive size={31} />
              </div>
              <p className="mt-4 text-lg font-extrabold text-ink">
                Drag your ZIP file here or click to browse
              </p>
              <p className="mt-2 text-sm font-medium text-ink-muted">
                All {requiredDocuments.length} documents in one ZIP file • PDF format only
              </p>
            </>
          )}
        </div>
      ) : (
        <DocumentUploadGrid 
          fields={requiredDocuments.map(doc => ({ key: doc.id, label: doc.label }))} 
          files={files} 
          onFileChange={handleFileChange} 
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-ink" htmlFor="zip-applicant-id">
            Applicant ID
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-white/[0.08] bg-surface-100 px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            id="zip-applicant-id"
            required
            type="text"
            value={applicantIdValue}
            onChange={(event) => setApplicantIdValue(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-bold text-ink" htmlFor="zip-bundle-id">
            Bundle ID
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-white/[0.08] bg-surface-100 px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            id="zip-bundle-id"
            required
            type="text"
            value={bundleIdValue}
            onChange={(event) => setBundleIdValue(event.target.value)}
          />
          <p className="mt-2 text-xs font-medium text-ink-faint">From the registration step</p>
        </div>
      </div>

      <button
        className="gradient-btn inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
        type="button"
        onClick={handleSubmit}
      >
        {isLoading ? 'Running Verification...' : 'Run Verification'}
        <ArrowRight size={18} />
      </button>

      {isLoading ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="space-y-3">
            {progressMessages.slice(0, activeStepIndex + 1).map((message, index) => {
              const isActive = index === activeStepIndex

              return (
                <div key={message} className="flex items-center gap-3 text-sm font-medium">
                  {isActive ? (
                    <Loader2 className="animate-spin text-primary-light" size={18} />
                  ) : (
                    <CheckCircle2 className="text-accent-emerald" size={18} />
                  )}
                  <span className={isActive ? 'text-primary-light' : 'text-accent-emerald'}>{message}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default ZipUploadZone
