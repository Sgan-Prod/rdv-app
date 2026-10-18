import { useState, useEffect } from 'react'
import { supabase } from './supabase/supabaseClient'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')

      if (error) {
        setError(error.message)
      } else {
        setItems(data)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <p>Chargement...</p>
  if (error) return <p>Erreur : {error}</p>

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.nom}</li>
      ))}
    </ul>
  )
}

export default App