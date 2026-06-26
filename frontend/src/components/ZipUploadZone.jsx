import { ArrowRight, CheckCircle2, FileArchive, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { verifyBundleZip } from '../api/client.js'

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
  const [zipFile, setZipFile] = useState(null)
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

  const canSubmit = useMemo(
    () => Boolean(zipFile && applicantIdValue.trim() && bundleIdValue.trim() && !isLoading),
    [applicantIdValue, bundleIdValue, isLoading, zipFile],
  )

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    const formData = new FormData()
    formData.append('zip_file', zipFile)
    formData.append('applicant_id', applicantIdValue.trim())
    formData.append('bundle_id', bundleIdValue.trim())
    formData.append('verification_type', verificationType)

    setError(null)
    setIsLoading(true)

    try {
      const response = await verifyBundleZip(formData)
      onUploadComplete(response.data)
    } catch (apiError) {
      setError(apiError.response?.data?.detail || apiError.message || 'ZIP verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-rise space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {demoMode ? (
        <div className="rounded-lg border border-amber-200 bg-[#FFF8EC] px-4 py-3 text-sm font-bold text-[#854F0B]">
          Drop your Bundle B (fraudulent) zip file to see fraud detection in action
        </div>
      ) : null}

      <div
        {...getRootProps()}
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed bg-white p-6 text-center transition hover:border-[#2D1B8E] hover:bg-indigo-50/40 ${
          isDragActive ? 'border-[#2D1B8E] bg-indigo-50/60' : 'border-slate-300'
        } ${zipFile ? 'border-[#0F6E56] bg-emerald-50/60' : ''}`}
      >
        <input {...getInputProps({ accept: '.zip' })} />
        {zipFile ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F6E56] text-white">
              <CheckCircle2 size={30} />
            </div>
            <p className="mt-4 text-lg font-black text-slate-950">{zipFile.name}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{formatFileSize(zipFile.size)}</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-50 text-[#2D1B8E]">
              <FileArchive size={31} />
            </div>
            <p className="mt-4 text-lg font-black text-slate-950">
              Drag your ZIP file here or click to browse
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              All {requiredDocuments.length} documents in one ZIP file • PDF format only
            </p>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-black text-slate-800" htmlFor="zip-applicant-id">
            Applicant ID
          </label>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2D1B8E] focus:ring-2 focus:ring-indigo-100"
            id="zip-applicant-id"
            required
            type="text"
            value={applicantIdValue}
            onChange={(event) => setApplicantIdValue(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-black text-slate-800" htmlFor="zip-bundle-id">
            Bundle ID
          </label>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2D1B8E] focus:ring-2 focus:ring-indigo-100"
            id="zip-bundle-id"
            required
            type="text"
            value={bundleIdValue}
            onChange={(event) => setBundleIdValue(event.target.value)}
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">From the registration step</p>
        </div>
      </div>

      <button
        className="scanline inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2D1B8E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
        disabled={!canSubmit}
        type="button"
        onClick={handleSubmit}
      >
        {isLoading ? 'Running Verification...' : 'Run Verification'}
        <ArrowRight size={18} />
      </button>

      {isLoading ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <div className="space-y-3">
            {progressMessages.slice(0, activeStepIndex + 1).map((message, index) => {
              const isActive = index === activeStepIndex

              return (
                <div key={message} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  {isActive ? (
                    <Loader2 className="animate-spin text-[#2D1B8E]" size={18} />
                  ) : (
                    <CheckCircle2 className="text-[#0F6E56]" size={18} />
                  )}
                  <span>{message}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-[#A32D2D]">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default ZipUploadZone
