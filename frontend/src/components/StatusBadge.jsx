import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const badgeStyles = {
  PASS: {
    className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 shadow-glow-emerald',
    icon: CheckCircle2,
    label: 'Verified',
  },
  FAIL: {
    className: 'bg-danger/10 text-danger border border-danger/20 shadow-glow-danger animate-pulse-glow',
    icon: XCircle,
    label: 'Fraud Detected',
  },
  WARNING: {
    className: 'bg-warning/10 text-warning border border-warning/20 shadow-glow-warning',
    icon: AlertTriangle,
    label: 'Warning',
  },
}

function StatusBadge({ status }) {
  const badge = badgeStyles[status] || badgeStyles.WARNING
  const Icon = badge.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
    >
      <Icon size={13} />
      {badge.label}
    </span>
  )
}

export default StatusBadge
