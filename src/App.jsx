import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase/supabaseClient'
import Login from './components/Login'
import Layout from './components/Layout'
import RdvList from './components/RdvList'
import PatientsList from './components/PatientsList'

function App() {
  // undefined = on ne sait pas encore, null = non connecté
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p>Chargement...</p>

  return (
    <Routes>
      <Route
        path="/connexion"
        element={session ? <Navigate to="/rendez-vous" replace /> : <Login />}
      />

      {/* Pages protégées : redirigées vers /connexion si non connecté */}
      <Route
        element={
          session ? (
            <Layout email={session.user.email} />
          ) : (
            <Navigate to="/connexion" replace />
          )
        }
      >
        <Route
          path="/rendez-vous"
          element={<RdvList email={session?.user.email} />}
        />
        <Route path="/patients" element={<PatientsList />} />
      </Route>

      {/* Toute autre adresse */}
      <Route path="*" element={<Navigate to="/rendez-vous" replace />} />
    </Routes>
  )
}

export default App