function LoadingSpinner({ message = 'Loading' }) {
  return (
    <div className="animate-rise flex flex-col items-center justify-center gap-4 rounded-lg border border-indigo-100 bg-white/85 py-10 text-slate-600 shadow-sm">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border border-indigo-100" />
        <div className="absolute inset-1 animate-spin rounded-full border-4 border-slate-200 border-t-[#2D1B8E]" />
        <div className="absolute inset-5 rounded-full bg-[#0F6E56]" />
      </div>
      <p className="animate-soft-pulse text-sm font-bold text-[#2D1B8E]">{message}</p>
    </div>
  )
}

export default LoadingSpinner
