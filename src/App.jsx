import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { supabase } from './supabase/supabaseClient'
import Login from './components/Login'
import Layout from './components/Layout'
import RdvList from './components/RdvList'
import PatientsList from './components/PatientsList'
import Etablissements from './components/Etablissements'
import Parametres from './components/Parametres'
import Utilisateurs from './components/Utilisateurs'

function App() {
  const [session, setSession] = useState(undefined) // undefined = chargement
  const [profile, setProfile] = useState(undefined) // null = introuvable

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) {
      setProfile(session === undefined ? undefined : null)
      return
    }
    supabase
      .from('profiles')
      .select('id, email, role, etablissement_id, etablissements(nom)')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data ?? null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (session === undefined || (session && profile === undefined))
    return <p className="p-6 text-slate-500">Chargement...</p>

  if (session && !profile)
    return (
      <div className="p-6">
        <p className="mb-4 text-red-700">Profil introuvable. Contacte l'administrateur.</p>
        <button onClick={() => supabase.auth.signOut()}
          className="rounded-md border px-3 py-1.5 text-sm">Se déconnecter</button>
      </div>
    )

  const isAdmin = profile?.role === 'admin'
  const sansEtablissement = profile && !isAdmin && !profile.etablissement_id

  if (sansEtablissement)
    return (
      <div className="p-6">
        <p className="mb-4 text-amber-700">
          Aucun établissement ne t'est encore assigné. Contacte l'administrateur.
        </p>
        <button onClick={() => supabase.auth.signOut()}
          className="rounded-md border px-3 py-1.5 text-sm">Se déconnecter</button>
      </div>
    )

  return (
    <Routes>
      <Route
        path="/connexion"
        element={session ? <Navigate to="/rendez-vous" replace /> : <Login />}
      />

      <Route
        element={session ? <Layout profile={profile} /> : <Navigate to="/connexion" replace />}
      >
        <Route path="/rendez-vous" element={<RdvList profile={profile} />} />
        <Route path="/patients" element={<PatientsList profile={profile} />} />

        {/* Pages réservées à l'admin */}
        <Route element={isAdmin ? <Outlet /> : <Navigate to="/rendez-vous" replace />}>
          <Route path="/etablissements" element={<Etablissements />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/utilisateurs" element={<Utilisateurs profile={profile} />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/rendez-vous" replace />} />
    </Routes>
  )
}

export default App