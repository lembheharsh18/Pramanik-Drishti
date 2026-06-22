import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const badgeStyles = {
  PASS: {
    className: 'bg-[#E1F5EE] text-[#085041] ring-[#A7E5D1]',
    icon: CheckCircle2,
    label: 'Verified',
  },
  FAIL: {
    className: 'bg-[#FCEBEB] text-[#A32D2D] ring-[#F4B5B5]',
    icon: XCircle,
    label: 'Fraud Detected',
  },
  WARNING: {
    className: 'bg-[#FFF8EC] text-[#854F0B] ring-[#F6D79C]',
    icon: AlertTriangle,
    label: 'Warning',
  },
}

function StatusBadge({ status }) {
  const badge = badgeStyles[status] || badgeStyles.WARNING
  const Icon = badge.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge.className}`}
    >
      <Icon size={13} />
      {badge.label}
    </span>
  )
}

export default StatusBadge
