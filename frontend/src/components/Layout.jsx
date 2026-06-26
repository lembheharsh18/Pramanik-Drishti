import { Check, ShieldCheck } from 'lucide-react'

const stepItems = [
  { key: 'select_type', label: 'Select Type' },
  { key: 'review_docs', label: 'Review Docs' },
  { key: 'verify', label: 'Upload & Verify' },
  { key: 'results', label: 'Results' },
]

const stepOrder = stepItems.map((step) => step.key)

function Layout({ children, currentStep = 'select_type', onBrandClick }) {
  const activeStep = currentStep === 'audit' ? 'results' : currentStep
  const activeStepIndex = Math.max(0, stepOrder.indexOf(activeStep))

  return (
    <div className="min-h-screen">
      <div className="signal-strip h-1" />
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button className="group flex items-center gap-3 text-left" type="button" onClick={onBrandClick}>
            <div className="scanline flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D1B8E] text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-lg font-black text-[#2D1B8E]">PRAMANIK-DRISHTI</p>
              <p className="text-xs font-semibold text-slate-500">Authentic Vision</p>
            </div>
          </button>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#0F6E56] ring-1 ring-emerald-100"
            title="All verification runs locally. No internet connection required."
          >
            <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
            Offline Mode
          </div>
        </nav>
        <div className="border-t border-slate-100 bg-white/70">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-6 py-3 md:grid-cols-4">
            {stepItems.map((step, index) => {
              const isCurrent = step.key === activeStep
              const isComplete = index < activeStepIndex
              const tone = isCurrent
                ? 'border-[#2D1B8E] bg-indigo-50 text-[#2D1B8E]'
                : isComplete
                  ? 'border-emerald-200 bg-emerald-50 text-[#0F6E56]'
                  : 'border-slate-200 bg-slate-50 text-slate-400'

              return (
                <div key={step.key} className={`flex items-center gap-2 rounded-md border px-3 py-2 ${tone}`}>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      isComplete ? 'bg-[#0F6E56] text-white' : isCurrent ? 'bg-[#2D1B8E] text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isComplete ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wide">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

export default Layout
