import { Clock3, Database, FileArchive, History, SearchCheck, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import Layout from './components/Layout.jsx'
import RequiredDocumentsList from './components/RequiredDocumentsList.jsx'
import VerificationTypeSelector, {
  VERIFICATION_TYPES,
} from './components/VerificationTypeSelector.jsx'
import AuditLog from './pages/AuditLog.jsx'
import Register from './pages/Register.jsx'
import Results from './pages/Results.jsx'
import Verify from './pages/Verify.jsx'

function App() {
  const [currentStep, setCurrentStep] = useState('home')
  const [operationMode, setOperationMode] = useState('instant')
  const [verificationType, setVerificationType] = useState(null)
  const [requiredDocuments, setRequiredDocuments] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [bundleId, setBundleId] = useState(null)
  const [registeredApplicantId, setRegisteredApplicantId] = useState('')
  const [registeredBundleId, setRegisteredBundleId] = useState('')
  const [caseHistory, setCaseHistory] = useState([])
  const [demoMode, setDemoMode] = useState(false)
  const [demoBundleId, setDemoBundleId] = useState('')

  useEffect(() => {
    try {
      setCaseHistory(JSON.parse(window.localStorage.getItem('case_history') || '[]'))
    } catch {
      setCaseHistory([])
    }
  }, [])

  const rememberCase = (entry) => {
    setCaseHistory((current) => {
      const next = [
        {
          recorded_at: new Date().toISOString(),
          ...entry,
        },
        ...current.filter((item) => item.bundle_id !== entry.bundle_id),
      ].slice(0, 6)

      window.localStorage.setItem('case_history', JSON.stringify(next))
      return next
    })
  }

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
    rememberCase({
      applicant_id: result.applicant_id || registeredApplicantId,
      bundle_id: result.bundle_id,
      product: VERIFICATION_TYPES[verificationType]?.label || 'Application',
      status: (result.insight_cards?.length || 0) > 0 ? 'Rejected / Review' : 'Verified',
    })
    setCurrentStep('results')
  }

  const handleReset = () => {
    setCurrentStep('home')
    setOperationMode('instant')
    setVerificationType(null)
    setRequiredDocuments(null)
    setVerificationResult(null)
    setBundleId(null)
    setRegisteredApplicantId('')
    setRegisteredBundleId('')
    setDemoMode(false)
    setDemoBundleId('')
  }

  const handleOperationSelect = (mode) => {
    setOperationMode(mode)
    setVerificationType(null)
    setRequiredDocuments(null)
    setVerificationResult(null)

    if (mode === 'baseline') {
      setCurrentStep('register')
      return
    }

    setCurrentStep('select_type')
  }

  const handleRegistrationComplete = (result) => {
    setRegisteredApplicantId(result.applicant_id || '')
    setRegisteredBundleId(result.bundle_id || '')
    setVerificationResult(null)
    setBundleId(result.bundle_id || null)
    rememberCase({
      applicant_id: result.applicant_id || '',
      bundle_id: result.bundle_id || '',
      product: VERIFICATION_TYPES[result.verification_type]?.label || 'Registered Bundle',
      status: 'Registered',
    })
    setDemoMode(false)
    setDemoBundleId('')
    setCurrentStep('select_type')
  }

  const handleUseHistoryCase = (caseItem) => {
    setOperationMode('existing')
    setRegisteredApplicantId(caseItem.applicant_id || '')
    setRegisteredBundleId(caseItem.bundle_id || '')
    setBundleId(caseItem.bundle_id || null)
    setCurrentStep('select_type')
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
      {currentStep === 'home' ? (
        <MainPage
          cases={caseHistory}
          onOperationSelect={handleOperationSelect}
          onUseCase={handleUseHistoryCase}
        />
      ) : null}

      {currentStep === 'register' ? (
        <Register
          onRegistered={handleRegistrationComplete}
          onSkip={() => {
            setOperationMode('existing')
            setCurrentStep('select_type')
          }}
        />
      ) : null}

      {currentStep === 'select_type' ? (
        <div className="space-y-6">
          {operationMode === 'instant' ? (
            <div className="animate-rise rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm font-bold text-primary-light">
              New detection: upload once. The system will seal the bundle and run checks automatically.
            </div>
          ) : registeredBundleId ? (
            <div className="animate-rise rounded-lg border border-accent-emerald/25 bg-accent-emerald/[0.06] px-4 py-3 text-sm font-bold text-accent-emerald">
              Active case: <span className="font-mono">{registeredApplicantId || 'Applicant'}</span>
              {' / '}
              <span className="font-mono">{registeredBundleId}</span>
            </div>
          ) : (
            <div className="animate-rise rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-bold text-warning">
              No registered bundle selected. You can continue if you already have a Bundle ID.
            </div>
          )}
          <WorkflowDirection />
          <CaseHistory cases={caseHistory} onUseCase={handleUseHistoryCase} />
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
          autoRegister={operationMode === 'instant'}
          demoApplicantId={demoMode ? 'DEMO-APPLICANT-001' : registeredApplicantId}
          demoBundleId={demoMode ? demoBundleId : registeredBundleId}
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

function MainPage({ cases, onOperationSelect, onUseCase }) {
  return (
    <section className="space-y-8">
      <div className="grid gap-6 rounded-lg border border-white/[0.08] bg-surface-100 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">
            Document Risk Operations
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            PRAMANIK-DRISHTI
          </h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-ink-muted">
            Register, verify, and review loan-document fraud signals through a controlled bank operations workflow.
          </p>
        </div>
        <div className="rounded-lg border border-accent-emerald/20 bg-accent-emerald/[0.06] px-4 py-3 text-sm font-bold text-accent-emerald">
          Bank Ops Console
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OperationCard
          icon={<SearchCheck size={24} />}
          title="New Detection"
          label="Recommended"
          text="Upload one ZIP, create the seal, and run fraud checks in a single flow."
          onClick={() => onOperationSelect('instant')}
        />
        <OperationCard
          icon={<History size={24} />}
          title="Verify Existing Bundle"
          text="Compare new uploads against a previously sealed Bundle ID for tamper detection."
          onClick={() => onOperationSelect('existing')}
        />
        <OperationCard
          icon={<Database size={24} />}
          title="Create Baseline Seal"
          text="Register documents now so a later upload can be checked against the original hash record."
          onClick={() => onOperationSelect('baseline')}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/[0.08] bg-surface-100 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary-light" size={22} />
            <h2 className="text-lg font-extrabold text-ink">How the bank workflow works</h2>
          </div>
          <div className="mt-4 space-y-3">
            <StepCard label="1" title="Choose operation" text="Start with a new detection or verify an existing sealed bundle." />
            <StepCard label="2" title="Choose detection type" text="Select the product/document category, such as home loan or MSME loan." />
            <StepCard label="3" title="Read verdict" text="The result page gives a concise decision; audit log keeps the details." />
          </div>
        </div>
        <CaseHistory cases={cases} onUseCase={onUseCase} />
      </section>
    </section>
  )
}

function OperationCard({ icon, title, text, label, onClick }) {
  return (
    <button
      className="rounded-lg border border-white/[0.08] bg-surface-100 p-5 text-left transition hover:border-primary/40 hover:bg-primary/[0.05]"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary-light">
          {icon}
        </span>
        {label ? (
          <span className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-2 py-1 text-[11px] font-extrabold uppercase text-accent-emerald">
            {label}
          </span>
        ) : null}
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-ink-muted">{text}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-light">
        Continue <FileArchive size={16} />
      </span>
    </button>
  )
}

function WorkflowDirection() {
  return (
    <section className="animate-rise grid gap-3 md:grid-cols-3">
      <StepCard label="1" title="Register" text="Create or select a sealed bundle before verification." />
      <StepCard label="2" title="Verify" text="Upload the same ZIP or PDFs and run controls." />
      <StepCard label="3" title="Decide" text="Read the verdict first; use audit log for evidence." />
    </section>
  )
}

function StepCard({ label, title, text }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-surface-100 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
          {label}
        </span>
        <div>
          <p className="font-bold text-ink">{title}</p>
          <p className="mt-1 text-sm font-medium leading-5 text-ink-muted">{text}</p>
        </div>
      </div>
    </div>
  )
}

function CaseHistory({ cases, onUseCase }) {
  if (cases.length === 0) {
    return null
  }

  return (
    <section className="animate-rise rounded-lg border border-white/[0.08] bg-surface-100 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="text-primary-light" size={18} />
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">Recent Case History</h2>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {cases.map((caseItem) => (
          <button
            key={`${caseItem.bundle_id}-${caseItem.recorded_at}`}
            className="rounded-lg border border-white/[0.06] bg-surface px-3 py-3 text-left transition hover:border-primary/30 hover:bg-primary/[0.04]"
            type="button"
            onClick={() => onUseCase(caseItem)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{caseItem.applicant_id || 'Applicant'}</p>
                <p className="mt-1 truncate font-mono text-xs text-ink-faint">{caseItem.bundle_id}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.08] px-2 py-1 text-[11px] font-bold text-ink-muted">
                {caseItem.status}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-ink-faint">{caseItem.product}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default App
