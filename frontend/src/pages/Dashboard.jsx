import {
  AlertTriangle,
  ArrowRight,
  CalendarX,
  CheckCircle,
  FileText,
  Lock,
  Radar,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { runCleanDemo, runFraudDemo, getSystemStatus } from '../api/client.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

function Dashboard({ onRegister, onVerify, onResults, onRunDemo }) {
  const [demoLoading, setDemoLoading] = useState(null)
  const [demoError, setDemoError] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await getSystemStatus()
        setSystemStatus(response.data)
      } catch (err) {
        console.error('Failed to fetch system status:', err)
      }
    }
    fetchStatus()
  }, [])

  const handleDemoRun = async (type) => {
    setDemoError(null)
    setDemoLoading(type)

    try {
      const response = type === 'clean' ? await runCleanDemo() : await runFraudDemo()
      const verification = response.data.verification
      onResults?.(verification)
    } catch (apiError) {
      setDemoError(apiError.response?.data?.detail || apiError.message || 'Demo run failed.')
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <section className="space-y-10">
      {/* Hero */}
      <div className="grid min-h-[520px] gap-8 border-b border-white/[0.06] pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-rise max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-emerald">
            <Radar size={14} />
            Canara SuRaksha prototype
          </div>
          <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] sm:text-7xl">
            <span className="gradient-text">PRAMANIK-DRISHTI</span>
          </h1>
          <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-ink">
            Real-time forgery detection and underwriter-ready intelligence for high-stakes loan documents.
          </p>
          <p className="mt-3 text-base font-medium text-ink-muted">
            Authentic Vision — the document that sees its own truth
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="gradient-btn inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white"
              type="button"
              onClick={onRegister}
            >
              Register Documents <ArrowRight size={16} />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-bold text-primary-light transition hover:bg-primary/20 hover:border-primary/50"
              type="button"
              onClick={onVerify}
            >
              Verify Application <ShieldCheck size={16} />
            </button>
          </div>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-emerald/15 px-5 py-3 text-sm font-bold text-accent-emerald transition hover:bg-accent-emerald/25"
            type="button"
            onClick={onRunDemo}
          >
            Run Demo <ArrowRight size={16} />
          </button>

          {/* Judge demo panel */}
          <div className="mt-5 glass-card p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-emerald">
              Judge demo mode
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-accent-emerald/15 px-4 py-2 text-sm font-bold text-accent-emerald transition hover:bg-accent-emerald/25"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('clean')}
              >
                Run Clean Demo
              </button>
              <button
                className="rounded-lg bg-danger/15 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger/25"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('fraud')}
              >
                Run Fraud Demo
              </button>
            </div>
            {demoError ? <p className="mt-3 text-sm font-bold text-danger">{demoError}</p> : null}
          </div>
          {demoLoading ? (
            <div className="mt-4">
              <LoadingSpinner
                message={`Running ${demoLoading === 'clean' ? 'clean' : 'fraud'} sample bundle...`}
              />
            </div>
          ) : null}
        </div>

        <VerificationScene />
      </div>

      {/* System Status */}
      {systemStatus ? (
        <div className="animate-rise-delay-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary-light flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold">System Status: {systemStatus.status.toUpperCase()}</span>
            <span className="text-ink-muted text-xs mt-1">{systemStatus.message}</span>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-ink-faint">DETECTION LAYERS</p>
              <p className="font-mono text-xs">{Object.keys(systemStatus.detection_layers).length} Active</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-ink-faint">FRAUD PATTERNS</p>
              <p className="font-mono text-xs">{systemStatus.fraud_patterns_loaded} Loaded</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Banking fraud losses FY 2026" value="Rs 40,774 Cr" />
        <StatCard label="Full bundle verification target" value="3 Seconds" />
        <StatCard label="Named fraud patterns detected" value="9 Patterns" />
      </div>

      {/* Features */}
      <div className="grid gap-5 lg:grid-cols-3">
        <FeatureCard
          icon={<Lock size={28} />}
          title="PRAMANIK-A — Hash Integrity"
          text="SHA-256 verification catches the smallest post-issuance file change before an underwriter sees the document."
        />
        <FeatureCard
          icon={<CalendarX size={28} />}
          title="PRAMANIK-B — Temporal Logic"
          text="Date and income rules expose frauds that look visually perfect but are logically impossible."
        />
        <FeatureCard
          icon={<FileText size={28} />}
          title="DRISHTI — Insight Cards"
          text="Every failure becomes a named fraud pattern with the failed check, explanation, and next action."
        />
      </div>

      {/* How It Works */}
      <section className="space-y-5">
        <h2 className="border-b border-white/[0.06] pb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">
          How It Works
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <FlowStep number="1" text="Register documents" />
          <FlowStep number="2" text="Submit bundle" />
          <FlowStep number="3" text="PRAMANIK verifies" />
          <FlowStep number="4" text="DRISHTI explains" />
        </div>
      </section>

      {/* Sample docs notice */}
      <div className="animate-rise-delay-2 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          <p>
            Demo sample documents are available in <span className="font-mono">backend/sample_docs</span>.
          </p>
        </div>
      </div>
    </section>
  )
}

function VerificationScene() {
  const stages = [
    { label: 'HASH', status: 'PASS', tone: 'text-accent-emerald' },
    { label: 'TEMPORAL', status: 'FAIL', tone: 'text-danger' },
    { label: 'MERKLE', status: 'PASS', tone: 'text-accent-emerald' },
    { label: 'DRISHTI', status: 'READY', tone: 'text-primary-light' },
  ]

  return (
    <div className="animate-rise-delay-1 glass-card p-5">
      <div className="glass-inset rounded-xl p-4">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-emerald">Live demo console</p>
            <p className="mt-1 text-lg font-extrabold text-ink">Verification Pipeline</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary-light">
            <Shield size={22} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.label}
              className="animate-rise flex items-center justify-between rounded-lg border border-white/[0.06] bg-surface-100 px-4 py-3"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-full border border-white/[0.08] bg-surface-200">
                  <span className="absolute inset-2 rounded-full bg-primary shadow-glow-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                  {stage.label}
                </span>
              </div>
              <span className={`text-sm font-extrabold ${stage.tone}`}>{stage.status}</span>
            </div>
          ))}
        </div>

        {/* Terminal output */}
        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.06] bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="glow-dot-emerald" />
            <span className="text-xs font-medium text-ink-faint">Audit log hash chain active</span>
          </div>
          <div className="space-y-2 font-mono text-[11px] text-ink-faint">
            <p>sha256: 8f12a9c1...3bde</p>
            <p>pattern: Backdated ITR Fraud</p>
            <p>action: escalate to fraud cell</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="animate-rise glass-card glass-card-hover p-5">
      <p className="text-3xl font-extrabold gradient-text">{value}</p>
      <p className="mt-2 text-sm font-medium text-ink-muted">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="animate-rise glass-card glass-card-hover p-5">
      <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary-light">{icon}</div>
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink-muted">{text}</p>
    </article>
  )
}

function FlowStep({ number, text }) {
  return (
    <div className="animate-rise glass-card flex items-center gap-3 p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-emerald text-sm font-bold text-surface shadow-glow-emerald">
        {number}
      </span>
      <p className="text-sm font-bold text-ink">{text}</p>
    </div>
  )
}

export default Dashboard
