import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100'
  }`

function Layout({ email }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <img src="/images/logo_podo.png" alt="Cabinet" className="mr-4 h-16 w-auto" />
          <NavLink to="/rendez-vous" className={linkClass}>Rendez-vous</NavLink>
          <NavLink to="/patients" className={linkClass}>Patients</NavLink>

          <span className="ml-auto hidden text-sm text-slate-500 sm:block">
            {email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Se déconnecter
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout