import { useState } from 'react'

import Layout from './components/Layout.jsx'
import RequiredDocumentsList from './components/RequiredDocumentsList.jsx'
import VerificationTypeSelector, {
  VERIFICATION_TYPES,
} from './components/VerificationTypeSelector.jsx'
import AuditLog from './pages/AuditLog.jsx'
import Results from './pages/Results.jsx'
import Verify from './pages/Verify.jsx'

function App() {
  const [currentStep, setCurrentStep] = useState('select_type')
  const [verificationType, setVerificationType] = useState(null)
  const [requiredDocuments, setRequiredDocuments] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [bundleId, setBundleId] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [demoBundleId, setDemoBundleId] = useState('')

  const handleTypeSelect = (selectedType, selectedDocumentIds) => {
    const documents = VERIFICATION_TYPES[selectedType].documents.filter((document) =>
      selectedDocumentIds.includes(document.id),
    )

    setVerificationType(selectedType)
    setRequiredDocuments(documents)
    setVerificationResult(null)
    setBundleId(null)
    setDemoMode(false)
    setDemoBundleId('')
    setCurrentStep('review_docs')
  }

  const handleUploadComplete = (result) => {
    setVerificationResult(result)
    setBundleId(result.bundle_id)
    setCurrentStep('results')
  }

  const handleReset = () => {
    setCurrentStep('select_type')
    setVerificationType(null)
    setRequiredDocuments(null)
    setVerificationResult(null)
    setBundleId(null)
    setDemoMode(false)
    setDemoBundleId('')
  }

  const handleRunDemo = () => {
    const homeLoanDocuments = VERIFICATION_TYPES.home_loan.documents

    setVerificationType('home_loan')
    setRequiredDocuments(homeLoanDocuments)
    setVerificationResult(null)
    setBundleId(null)
    setDemoMode(true)
    setDemoBundleId(window.localStorage.getItem('demo_bundle_id') || '')
    setCurrentStep('verify')
  }

  return (
    <Layout currentStep={currentStep} onBrandClick={handleReset}>
      {currentStep === 'select_type' ? (
        <div className="space-y-6">
          <div className="animate-rise glass-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-emerald">
                  Demo mode
                </p>
                <p className="mt-1 text-sm font-medium text-ink-muted">
                  Use the pre-loaded Home Loan sample and drop Bundle B to see fraud detection in action.
                </p>
              </div>
              <button
                className="gradient-btn inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white"
                type="button"
                onClick={handleRunDemo}
              >
                Run Demo →
              </button>
            </div>
          </div>
          <VerificationTypeSelector onSelect={handleTypeSelect} />
        </div>
      ) : null}

      {currentStep === 'review_docs' && verificationType && requiredDocuments ? (
        <RequiredDocumentsList
          documents={requiredDocuments}
          verificationType={verificationType}
          onBack={() => setCurrentStep('select_type')}
          onProceed={() => setCurrentStep('verify')}
        />
      ) : null}

      {currentStep === 'verify' && verificationType && requiredDocuments ? (
        <Verify
          demoApplicantId={demoMode ? 'DEMO-APPLICANT-001' : ''}
          demoBundleId={demoMode ? demoBundleId : ''}
          demoMode={demoMode}
          requiredDocuments={requiredDocuments}
          verificationType={verificationType}
          onBack={() => setCurrentStep('review_docs')}
          onUploadComplete={handleUploadComplete}
        />
      ) : null}

      {currentStep === 'results' ? (
        <Results
          result={verificationResult}
          onVerifyAnother={handleReset}
          onViewAudit={() => setCurrentStep('audit')}
        />
      ) : null}

      {currentStep === 'audit' ? (
        <AuditLog bundleId={bundleId} onBackToResults={() => setCurrentStep('results')} />
      ) : null}
    </Layout>
  )
}

export default App
