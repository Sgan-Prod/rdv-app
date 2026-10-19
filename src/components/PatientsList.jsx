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

    if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Patients</h2>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du patient"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Ajouter
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {patients.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{p.nom}</span>
            <button onClick={() => handleDelete(p.id)}
              className="text-sm text-red-600 hover:underline">
              Supprimer
            </button>
          </li>
        ))}
        {patients.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-400">Aucun patient</li>
        )}
      </ul>
    </div>
  )
}

export default PatientsList