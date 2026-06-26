import ZipUploadZone from '../components/ZipUploadZone.jsx'
import { VERIFICATION_TYPES } from '../components/VerificationTypeSelector.jsx'

function Verify({
  verificationType,
  requiredDocuments,
  onUploadComplete,
  onBack,
  demoMode = false,
  demoApplicantId = '',
  demoBundleId = '',
}) {
  const selectedVerification = VERIFICATION_TYPES[verificationType]

  if (!selectedVerification || !requiredDocuments) {
    return null
  }

  return (
    <section className="space-y-6">
      {demoMode ? (
        <div className="animate-rise rounded-lg border border-amber-200 bg-[#FFF8EC] px-4 py-3 text-sm font-black text-[#854F0B]">
          Demo mode — using pre-loaded sample documents
        </div>
      ) : null}

      <div className="animate-rise flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">Verification</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Verify {selectedVerification.label} Bundle
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {selectedVerification.description}
          </p>
          <button
            className="mt-4 text-sm font-black text-[#2D1B8E] transition hover:text-indigo-950"
            type="button"
            onClick={onBack}
          >
            Back to required documents
          </button>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2D1B8E]">ZIP bundle</p>
          <p className="mt-1 text-2xl font-black text-[#2D1B8E]">
            {requiredDocuments.length} PDFs
          </p>
        </div>
      </div>

      <ZipUploadZone
        applicantId={demoApplicantId}
        bundleId={demoBundleId}
        demoMode={demoMode}
        requiredDocuments={requiredDocuments}
        verificationType={verificationType}
        onUploadComplete={onUploadComplete}
      />
    </section>
  )
}

export default Verify
