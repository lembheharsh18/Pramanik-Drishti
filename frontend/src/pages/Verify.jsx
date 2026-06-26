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
        <div className="animate-rise rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-bold text-warning">
          Demo mode — using pre-loaded sample documents
        </div>
      ) : null}

      <div className="animate-rise glass-card flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">Verification</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">
            Verify {selectedVerification.label} Bundle
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            {selectedVerification.description}
          </p>
          <button
            className="mt-4 text-sm font-bold text-primary-light transition hover:text-primary"
            type="button"
            onClick={onBack}
          >
            ← Back to required documents
          </button>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-light">ZIP bundle</p>
          <p className="mt-1 text-2xl font-extrabold text-primary-light">
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
