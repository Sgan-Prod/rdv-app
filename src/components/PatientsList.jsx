import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'

function PatientsList() {
  const [patients, setPatients] = useState([])
  const [nom, setNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase
        .from('patients')
        .select('id, nom')
        .order('nom')

      if (error) setError(error.message)
      else setPatients(data)
      setLoading(false)
    }
    fetchPatients()
  }, [])

  // CREATE
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!nom.trim()) return

    const { data, error } = await supabase
      .from('patients')
      .insert({ nom: nom.trim() })
      .select()
      .single()

    if (error) setError(error.message)
    else {
      setPatients((prev) =>
        [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom))
      )
      setNom('')
    }
  }

  // DELETE
  async function handleDelete(id) {
    if (!confirm('Supprimer ce patient ?')) return
    setError('')

    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) {
      setError(
        'Suppression impossible : ce patient a sûrement des rendez-vous. ' +
          error.message
      )
    } else {
      setPatients((prev) => prev.filter((p) => p.id !== id))
    }
  }

  if (loading) return <p>Chargement...</p>

  return (
    <div>
      <h2>Patients</h2>

      <form onSubmit={handleSubmit}>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du patient"
          required
        />
        <button type="submit">Ajouter</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.nom}{' '}
            <button onClick={() => handleDelete(p.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PatientsList