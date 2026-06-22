import { FilePlus2, Gauge, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { icon: Gauge, label: 'Dashboard', to: '/' },
  { icon: FilePlus2, label: 'Register Documents', to: '/register' },
  { icon: ShieldCheck, label: 'Verify Application', to: '/verify' },
]

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <div className="signal-strip h-1" />
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <NavLink className="group flex items-center gap-3" to="/">
            <div className="scanline flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D1B8E] text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-lg font-black text-[#2D1B8E]">PRAMANIK-DRISHTI</p>
              <p className="text-xs font-semibold text-slate-500">Authentic Vision</p>
            </div>
          </NavLink>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-600">
            {navLinks.map((link) => {
              const Icon = link.icon

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md border px-3 py-2 transition ${
                      isActive
                        ? 'border-[#2D1B8E] bg-indigo-50 text-[#2D1B8E] shadow-sm'
                        : 'border-transparent hover:border-slate-200 hover:bg-white hover:text-[#2D1B8E]'
                    }`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

export default Layout
