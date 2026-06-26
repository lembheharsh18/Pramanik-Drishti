import { ArrowRight, Briefcase, Building2, Check, Home, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'

export const VERIFICATION_TYPES = {
  home_loan: {
    label: 'Home Loan',
    description: 'Land record, salary slips, ITR, valuation report, sale deed',
    icon: 'home',
    documents: [
      { id: 'land_record', label: 'Land Ownership Record', description: '7/12 extract or patta' },
      { id: 'salary_slip_1', label: 'Salary Slip — Month 1 (Most Recent)', description: 'Latest month' },
      { id: 'salary_slip_2', label: 'Salary Slip — Month 2', description: 'One month before Month 1' },
      { id: 'salary_slip_3', label: 'Salary Slip — Month 3 (Oldest)', description: 'Two months before Month 1' },
      { id: 'itr', label: 'Income Tax Return', description: 'AY 2024-25 ITR-V acknowledgement' },
      { id: 'valuation_report', label: 'Property Valuation Report', description: 'From a registered valuer' },
      { id: 'sale_deed', label: 'Sale Deed / Registered Agreement', description: 'Registered with sub-registrar' },
    ],
  },
  business_loan: {
    label: 'Business Loan',
    description: 'Business registration, GST returns, balance sheet, bank statements, CA certificate',
    icon: 'building',
    documents: [
      { id: 'business_registration', label: 'Business Registration Certificate', description: 'MOA/AOA or partnership deed' },
      { id: 'gst_returns', label: 'GST Returns (Last 12 months)', description: 'GSTR-3B or GSTR-1' },
      { id: 'balance_sheet', label: 'Balance Sheet (Last 2 years)', description: 'CA certified' },
      { id: 'bank_statement_6months', label: 'Bank Statement (Last 6 months)', description: 'Primary operating account' },
      { id: 'ca_certificate', label: 'CA Certificate', description: 'Net worth and income certification' },
    ],
  },
  land_mutation: {
    label: 'Land Mutation',
    description: 'Mutation application, old title deed, property tax receipt, NOC, identity proof',
    icon: 'map-pin',
    documents: [
      { id: 'mutation_application', label: 'Mutation Application Form', description: 'Signed application for mutation' },
      { id: 'title_deed', label: 'Title Deed / Sale Deed', description: 'Registered ownership document' },
      { id: 'property_tax_receipt', label: 'Property Tax Receipt', description: 'Latest paid receipt' },
      { id: 'noc', label: 'No Objection Certificate', description: 'From relevant authority if applicable' },
      { id: 'identity_proof', label: 'Identity Proof', description: 'Aadhaar, PAN, or passport' },
    ],
  },
  msme_loan: {
    label: 'MSME Loan',
    description: 'Business registration, last 2 years ITR, CA certified financials, GST certificate, bank statements',
    icon: 'briefcase',
    documents: [
      { id: 'business_registration', label: 'Business Registration / Udyam Certificate', description: 'MSME/Udyam registration proof' },
      { id: 'itr_2years', label: 'ITR Last 2 Years', description: 'Income Tax Returns for last 2 financial years' },
      { id: 'ca_financials', label: 'CA Certified Financial Statements', description: 'P&L and balance sheet, CA certified' },
      { id: 'gst_certificate', label: 'GST Registration Certificate', description: 'Valid GST registration' },
      { id: 'bank_statement_12months', label: 'Bank Statement (Last 12 months)', description: 'Primary business account' },
    ],
  },
}

const iconMap = {
  home: Home,
  building: Building2,
  'map-pin': MapPin,
  briefcase: Briefcase,
}

function VerificationTypeSelector({ onSelect }) {
  const [selectedType, setSelectedType] = useState(null)

  const selectedDocuments = useMemo(() => {
    if (!selectedType) {
      return []
    }

    return VERIFICATION_TYPES[selectedType].documents.map((document) => document.id)
  }, [selectedType])

  const handleContinue = () => {
    if (!selectedType) {
      return
    }

    onSelect(selectedType, selectedDocuments)
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col justify-center py-8">
      <div className="animate-rise text-center">
        <h1 className="text-4xl font-black leading-tight text-[#2D1B8E] sm:text-6xl">
          PRAMANIK-DRISHTI
        </h1>
        <p className="mt-4 text-base font-bold text-slate-600 sm:text-lg">
          Select the type of verification to begin
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {Object.entries(VERIFICATION_TYPES).map(([type, verification]) => {
          const Icon = iconMap[verification.icon]
          const isSelected = selectedType === type

          return (
            <button
              key={type}
              aria-pressed={isSelected}
              className={`group relative flex min-h-56 w-full flex-col rounded-[12px] border bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#2D1B8E] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2D1B8E] focus:ring-offset-2 ${
                isSelected
                  ? 'border-[#2D1B8E] border-l-[8px] shadow-md ring-1 ring-indigo-100'
                  : 'border-slate-300'
              }`}
              type="button"
              onClick={() => setSelectedType(type)}
            >
              {isSelected ? (
                <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#2D1B8E] text-white">
                  <Check size={18} strokeWidth={3} />
                </span>
              ) : null}

              <span
                className={`flex h-12 w-12 items-center justify-center rounded-lg transition ${
                  isSelected ? 'bg-[#2D1B8E] text-white' : 'bg-indigo-50 text-[#2D1B8E]'
                }`}
              >
                <Icon size={25} />
              </span>
              <span className="mt-5 pr-8 text-2xl font-black text-slate-950">
                {verification.label}
              </span>
              <span className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {verification.description}
              </span>
              <span className="mt-auto pt-6 text-xs font-black uppercase tracking-[0.16em] text-slate-400 group-hover:text-[#2D1B8E]">
                {verification.documents.length} documents required
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          className="inline-flex min-w-48 items-center justify-center gap-2 rounded-md bg-[#2D1B8E] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
          disabled={!selectedType}
          type="button"
          onClick={handleContinue}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}

export default VerificationTypeSelector
