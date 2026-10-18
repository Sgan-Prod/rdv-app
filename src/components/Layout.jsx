import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'

function Layout({ email }) {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <NavLink to="/rendez-vous">Rendez-vous</NavLink>
        <NavLink to="/patients">Patients</NavLink>
        <span style={{ marginLeft: 'auto' }}>{email}</span>
        <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </nav>
      <hr />
      <Outlet />
    </div>
  )
}

export default Layout