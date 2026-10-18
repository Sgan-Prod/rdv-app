import { useState, useEffect } from 'react'
import { supabase } from './supabase/supabaseClient'
import Login from './components/Login'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Récupère la session existante au chargement
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Écoute les connexions / déconnexions
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!session) return <Login />

  return (
    <div>
      <p>Connecté en tant que {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </div>
  )
}

export default App