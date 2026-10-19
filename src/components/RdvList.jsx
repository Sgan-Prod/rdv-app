import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { Pencil, Trash2 } from 'lucide-react'

const SELECT_RDV =
  '*, patients(nom), statuts(libelle), moyens_paiement(libelle), etablissements(nom)'

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
const label = 'mb-1 block text-xs font-medium text-slate-600'

function badgeClass(libelle = '') {
  const l = libelle.toLowerCase()
  if (l.includes('pay')) return 'bg-green-100 text-green-700'
  if (l.includes('annul')) return 'bg-red-100 text-red-700'
  if (l.includes('vérif')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

const formatDate = (d) => (d ? d.split('-').reverse().join('/') : '')
const formatEuro = (n) =>
  n != null
    ? Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
    : ''

function RdvList({ profile }) {
  const isAdmin = profile.role === 'admin'
  const formVide = {
    date_rdv: '',
    etablissement_id: isAdmin ? '' : String(profile.etablissement_id),
    patient_id: '',
    statut_id: '',
    facture: '',
    moyen_paiement_id: '',
    commentaire: '',
  }

  const [rdvs, setRdvs] = useState([])
  const [patients, setPatients] = useState([])
  const [statuts, setStatuts] = useState([])
  const [moyens, setMoyens] = useState([])
  const [etabs, setEtabs] = useState([])
  const [form, setForm] = useState(formVide)
  const [filtreEtab, setFiltreEtab] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      const [r, p, s, m, e] = await Promise.all([
        supabase.from('rendez_vous').select(SELECT_RDV).order('date_rdv', { ascending: false }),
        supabase.from('patients').select('id, nom, etablissement_id').order('nom'),
        supabase.from('statuts').select('id, libelle'),
        supabase.from('moyens_paiement').select('id, libelle'),
        supabase.from('etablissements').select('id, nom').order('nom'),
      ])
      const err = r.error || p.error || s.error || m.error || e.error
      if (err) setError(err.message)
      else {
        setRdvs(r.data)
        setPatients(p.data)
        setStatuts(s.data)
        setMoyens(m.data)
        setEtabs(e.data)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    // Si l'admin change d'établissement, le patient choisi n'est plus valide
    if (name === 'etablissement_id') setForm({ ...form, etablissement_id: value, patient_id: '' })
    else setForm({ ...form, [name]: value })
  }

  function startEdit(r) {
    setEditingId(r.id)
    setError('')
    setForm({
      date_rdv: r.date_rdv ?? '',
      etablissement_id: String(r.etablissement_id),
      patient_id: r.patient_id != null ? String(r.patient_id) : '',
      statut_id: r.statut_id != null ? String(r.statut_id) : '',
      facture: r.facture ?? '',
      moyen_paiement_id: r.moyen_paiement_id != null ? String(r.moyen_paiement_id) : '',
      commentaire: r.commentaire ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(formVide)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      date_rdv: form.date_rdv,
      etablissement_id: Number(form.etablissement_id),
      patient_id: Number(form.patient_id),
      statut_id: form.statut_id ? Number(form.statut_id) : null,
      facture: form.facture !== '' ? Number(form.facture) : null,
      moyen_paiement_id: form.moyen_paiement_id ? Number(form.moyen_paiement_id) : null,
      commentaire: form.commentaire || null,
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('rendez_vous').update(payload).eq('id', editingId)
        .select(SELECT_RDV).single()
      if (error) setError(error.message)
      else {
        setRdvs((prev) => prev.map((r) => (r.id === editingId ? data : r)))
        cancelEdit()
      }
    } else {
      const { data, error } = await supabase
        .from('rendez_vous').insert({ ...payload, rdv_pris_par: profile.email })
        .select(SELECT_RDV).single()
      if (error) setError(error.message)
      else {
        setRdvs((prev) => [data, ...prev])
        setForm(formVide)
      }
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    const { error } = await supabase.from('rendez_vous').delete().eq('id', id)
    if (error) setError(error.message)
    else {
      setRdvs((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) cancelEdit()
    }
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  const patientsDuForm = patients.filter(
    (p) => String(p.etablissement_id) === String(form.etablissement_id)
  )
  const rdvsAffiches = filtreEtab
    ? rdvs.filter((r) => String(r.etablissement_id) === filtreEtab)
    : rdvs

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          {editingId ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        </h2>

        <form onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <div>
              <label className={label}>Établissement</label>
              <select name="etablissement_id" value={form.etablissement_id}
                onChange={handleChange} required className={field}>
                <option value="">Choisir...</option>
                {etabs.map((et) => <option key={et.id} value={et.id}>{et.nom}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={label}>Date</label>
            <input type="date" name="date_rdv" value={form.date_rdv}
              onChange={handleChange} required className={field} />
          </div>

          <div>
            <label className={label}>Patient</label>
            <select name="patient_id" value={form.patient_id}
              onChange={handleChange} required className={field}>
              <option value="">Choisir...</option>
              {patientsDuForm.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>Statut</label>
            <select name="statut_id" value={form.statut_id} onChange={handleChange} className={field}>
              <option value="">Choisir...</option>
              {statuts.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>Facture (€)</label>
            <input type="number" step="0.01" name="facture" value={form.facture}
              onChange={handleChange} className={field} />
          </div>

          <div>
            <label className={label}>Moyen de paiement</label>
            <select name="moyen_paiement_id" value={form.moyen_paiement_id}
              onChange={handleChange} className={field}>
              <option value="">Choisir...</option>
              {moyens.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>Commentaire</label>
            <input name="commentaire" value={form.commentaire}
              onChange={handleChange} className={field} />
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Annuler
              </button>
            )}
          </div>
        </form>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      {isAdmin && (
        <div className="max-w-xs">
          <label className={label}>Filtrer par établissement</label>
          <select value={filtreEtab} onChange={(e) => setFiltreEtab(e.target.value)} className={field}>
            <option value="">Tous</option>
            {etabs.map((et) => <option key={et.id} value={et.id}>{et.nom}</option>)}
          </select>
        </div>
      )}

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              {isAdmin && <th className="px-4 py-3">Établissement</th>}
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Facture</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Pris par</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rdvsAffiches.map((r) => (
              <tr key={r.id} className={r.id === editingId ? 'bg-amber-50' : 'hover:bg-slate-50'}>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(r.date_rdv)}</td>
                {isAdmin && <td className="px-4 py-3">{r.etablissements?.nom}</td>}
                <td className="px-4 py-3 font-medium">{r.patients?.nom}</td>
                <td className="px-4 py-3">
                  {r.statuts && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(r.statuts.libelle)}`}>
                      {r.statuts.libelle}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatEuro(r.facture)}</td>
                <td className="px-4 py-3">{r.moyens_paiement?.libelle}</td>
                <td className="px-4 py-3 text-slate-500">{r.rdv_pris_par}</td>
   <td className="whitespace-nowrap px-4 py-3 text-right">
  <button
    onClick={() => startEdit(r)}
    title="Modifier"
    aria-label="Modifier"
    className="mr-1 rounded-md p-2 text-indigo-600 hover:bg-indigo-50"
  >
    <Pencil size={18} />
  </button>
  {isAdmin && (
    <button
      onClick={() => handleDelete(r.id)}
      title="Supprimer"
      aria-label="Supprimer"
      className="rounded-md p-2 text-red-600 hover:bg-red-50"
    >
      <Trash2 size={18} />
    </button>
  )}
</td>
              </tr>
            ))}
            {rdvsAffiches.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-400">Aucun rendez-vous</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default RdvList