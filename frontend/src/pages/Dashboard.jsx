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
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { runCleanDemo, runFraudDemo } from '../api/client.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

function Dashboard() {
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(null)
  const [demoError, setDemoError] = useState(null)

  const handleDemoRun = async (type) => {
    setDemoError(null)
    setDemoLoading(type)

    try {
      const response = type === 'clean' ? await runCleanDemo() : await runFraudDemo()
      const verification = response.data.verification
      navigate(`/results/${verification.bundle_id}`, { state: verification })
    } catch (apiError) {
      setDemoError(apiError.response?.data?.detail || apiError.message || 'Demo run failed.')
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <section className="space-y-10">
      <div className="grid min-h-[520px] gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-rise max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#0F6E56]">
            <Radar size={14} />
            Canara SuRaksha prototype
          </div>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] text-[#2D1B8E] sm:text-7xl">
            PRAMANIK-DRISHTI
          </h1>
          <p className="mt-5 max-w-3xl text-xl font-bold leading-8 text-slate-800">
            Real-time forgery detection and underwriter-ready intelligence for high-stakes loan documents.
          </p>
          <p className="mt-3 text-base font-semibold text-slate-500">
            Authentic Vision - the document that sees its own truth
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="scanline inline-flex items-center gap-2 rounded-md bg-[#2D1B8E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950" to="/register">
              Register Documents <ArrowRight size={16} />
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-md border border-[#2D1B8E] bg-white px-5 py-3 text-sm font-black text-[#2D1B8E] shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50" to="/verify">
              Verify Application <ShieldCheck size={16} />
            </Link>
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F6E56]">
              Judge demo mode
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-[#0F6E56] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('clean')}
              >
                Run Clean Demo
              </button>
              <button
                className="rounded-md bg-[#A32D2D] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
                disabled={Boolean(demoLoading)}
                type="button"
                onClick={() => handleDemoRun('fraud')}
              >
                Run Fraud Demo
              </button>
            </div>
            {demoError ? <p className="mt-3 text-sm font-bold text-[#A32D2D]">{demoError}</p> : null}
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

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Banking fraud losses FY 2026" value="Rs 40,774 Cr" />
        <StatCard label="Full bundle verification target" value="3 Seconds" />
        <StatCard label="Named fraud patterns detected" value="9 Patterns" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <FeatureCard
          icon={<Lock size={28} />}
          title="PRAMANIK-A - Hash Integrity"
          text="SHA-256 verification catches the smallest post-issuance file change before an underwriter sees the document."
        />
        <FeatureCard
          icon={<CalendarX size={28} />}
          title="PRAMANIK-B - Temporal Logic"
          text="Date and income rules expose frauds that look visually perfect but are logically impossible."
        />
        <FeatureCard
          icon={<FileText size={28} />}
          title="DRISHTI - Insight Cards"
          text="Every failure becomes a named fraud pattern with the failed check, explanation, and next action."
        />
      </div>

      <section className="space-y-5">
        <h2 className="border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">
          How It Works
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <FlowStep number="1" text="Register documents" />
          <FlowStep number="2" text="Submit bundle" />
          <FlowStep number="3" text="PRAMANIK verifies" />
          <FlowStep number="4" text="DRISHTI explains" />
        </div>
      </section>

      <div className="animate-rise-delay-2 rounded-lg border border-amber-200 bg-[#FFF8EC] p-4 text-sm text-[#854F0B]">
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
    { label: 'HASH', status: 'PASS', tone: 'text-[#0F6E56]' },
    { label: 'TEMPORAL', status: 'FAIL', tone: 'text-[#A32D2D]' },
    { label: 'MERKLE', status: 'PASS', tone: 'text-[#0F6E56]' },
    { label: 'DRISHTI', status: 'READY', tone: 'text-[#2D1B8E]' },
  ]

  return (
    <div className="animate-rise-delay-1 circuit-bg rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">Live demo console</p>
            <p className="mt-1 text-lg font-black text-slate-950">Verification Pipeline</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[#2D1B8E]">
            <Shield size={22} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.label}
              className="animate-rise flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-full border border-slate-200 bg-white">
                  <span className="absolute inset-2 rounded-full bg-[#2D1B8E]" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {stage.label}
                </span>
              </div>
              <span className={`text-sm font-black ${stage.tone}`}>{stage.status}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
            <span className="text-xs font-bold text-slate-300">Audit log hash chain active</span>
          </div>
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
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
    <div className="animate-rise rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-3xl font-black text-[#2D1B8E]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="animate-rise rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="inline-flex rounded-lg bg-indigo-50 p-3 text-[#2D1B8E]">{icon}</div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  )
}

function FlowStep({ number, text }) {
  return (
    <div className="animate-rise flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F6E56] text-sm font-black text-white">
        {number}
      </span>
      <p className="text-sm font-black text-slate-800">{text}</p>
    </div>
  )
}

export default Dashboard
