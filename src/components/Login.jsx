import { useState } from 'react'
import { supabase } from '../supabase/supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(error.message)
    else if (isSignUp) setMessage('Compte créé !')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignUp ? 'Inscription' : 'Connexion'}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Mot de passe (6 caractères min.)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      <button type="submit">
        {isSignUp ? "S'inscrire" : 'Se connecter'}
      </button>

      <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Inscription'}
      </button>

      {message && <p>{message}</p>}
    </form>
  )
}

export default Login