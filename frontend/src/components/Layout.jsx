import { Check, ShieldCheck } from 'lucide-react'

const stepItems = [
  { key: 'home', label: 'Main' },
  { key: 'select_type', label: 'Detection Type' },
  { key: 'review_docs', label: 'Review Docs' },
  { key: 'verify', label: 'Upload & Run' },
  { key: 'results', label: 'Verdict' },
]

const stepOrder = stepItems.map((step) => step.key)

function Layout({ children, currentStep = 'select_type', onBrandClick }) {
  const activeStep = currentStep === 'audit' ? 'results' : currentStep === 'register' ? 'select_type' : currentStep
  const activeStepIndex = Math.max(0, stepOrder.indexOf(activeStep))

  return (
    <div className="min-h-screen">
      {/* Animated gradient strip */}
      <div className="gradient-strip h-1" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-surface-50/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button className="group flex items-center gap-3 text-left" type="button" onClick={onBrandClick}>
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-glow-primary">
              <ShieldCheck size={22} />
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-wide text-ink">
                <span className="gradient-text">PRAMANIK</span>
                <span className="text-ink-muted">-</span>
                <span className="text-accent-emerald">DRISHTI</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                Authentic Vision
              </p>
            </div>
          </button>

          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1.5 text-xs font-bold text-accent-emerald"
            title="Internal document verification workflow"
          >
            <span className="glow-dot-emerald" />
            Bank Ops Console
          </div>
        </nav>

        {/* Step indicator bar */}
        <div className="border-t border-white/[0.04] bg-surface/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-6 py-3 md:grid-cols-5">
            {stepItems.map((step, index) => {
              const isCurrent = step.key === activeStep
              const isComplete = index < activeStepIndex

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-300 ${
                    isCurrent
                      ? 'border-primary/40 bg-primary/10 text-primary-light shadow-glow-primary'
                      : isComplete
                        ? 'border-accent-emerald/20 bg-accent-emerald/5 text-accent-emerald'
                        : 'border-white/[0.06] bg-surface-100 text-ink-faint'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isComplete
                        ? 'bg-accent-emerald text-surface shadow-glow-emerald'
                        : isCurrent
                          ? 'bg-primary text-white shadow-glow-primary'
                          : 'bg-surface-300 text-ink-faint'
                    }`}
                  >
                    {isComplete ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-surface-50/50">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-center text-xs font-medium text-ink-faint">
            Pramanik-Drishti • Canara Bank SuRaksha Hackathon • Tamper-evident document verification
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
