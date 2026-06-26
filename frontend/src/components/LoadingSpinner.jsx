function LoadingSpinner({ message = 'Loading' }) {
  return (
    <div className="animate-rise glass-card flex flex-col items-center justify-center gap-5 py-12">
      <div className="relative h-16 w-16">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        {/* Spinning ring */}
        <div className="absolute inset-1 animate-spin rounded-full border-[3px] border-surface-300 border-t-primary" />
        {/* Counter-spin inner ring */}
        <div className="absolute inset-3 animate-spin-slow rounded-full border-2 border-surface-200 border-b-accent-emerald" style={{ animationDirection: 'reverse' }} />
        {/* Center glow dot */}
        <div className="absolute inset-[22px] rounded-full bg-primary shadow-glow-primary" />
      </div>
      <p className="animate-soft-pulse text-sm font-bold text-primary-light">{message}</p>
    </div>
  )
}

export default LoadingSpinner
