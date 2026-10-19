import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { Trash2 } from 'lucide-react'

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

function PatientsList({ profile }) {
  const isAdmin = profile.role === 'admin'
  const [patients, setPatients] = useState([])
  const [etabs, setEtabs] = useState([])
  const [nom, setNom] = useState('')
  const [etabId, setEtabId] = useState(isAdmin ? '' : String(profile.etablissement_id))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [p, e] = await Promise.all([
        supabase.from('patients').select('id, nom, etablissement_id, etablissements(nom)').order('nom'),
        supabase.from('etablissements').select('id, nom').order('nom'),
      ])
      if (p.error || e.error) setError((p.error || e.error).message)
      else {
        setPatients(p.data)
        setEtabs(e.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase
      .from('patients')
      .insert({ nom: nom.trim(), etablissement_id: Number(etabId) })
      .select('id, nom, etablissement_id, etablissements(nom)')
      .single()

    if (error) setError(error.message)
    else {
      setPatients((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
      setNom('')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce patient ?')) return
    setError('')
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error)
      setError('Suppression impossible : ce patient a sûrement des rendez-vous. ' + error.message)
    else setPatients((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Patients</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && (
            <select value={etabId} onChange={(e) => setEtabId(e.target.value)} required className={field}>
              <option value="">Établissement...</option>
              {etabs.map((et) => <option key={et.id} value={et.id}>{et.nom}</option>)}
            </select>
          )}
          <input value={nom} onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du patient" required className={field} />
          <button type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Ajouter
          </button>
        </form>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {patients.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <span>
              <span className="font-medium">{p.nom}</span>
              {isAdmin && (
                <span className="ml-2 text-xs text-slate-400">{p.etablissements?.nom}</span>
              )}
            </span>
            {isAdmin && (
              <button
  onClick={() => handleDelete(p.id)}
  title="Supprimer"
  aria-label="Supprimer"
  className="rounded-md p-2 text-red-600 hover:bg-red-50"
>
  <Trash2 size={18} />
</button>
            )}
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