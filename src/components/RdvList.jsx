import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'

const SELECT_RDV =
  '*, patients(nom), statuts(libelle), moyens_paiement(libelle)'

const FORM_VIDE = {
  date_rdv: '',
  patient_id: '',
  statut_id: '',
  facture: '',
  moyen_paiement_id: '',
  commentaire: '',
}

function RdvList({ email }) {
  const [rdvs, setRdvs] = useState([])
  const [patients, setPatients] = useState([])
  const [statuts, setStatuts] = useState([])
  const [moyens, setMoyens] = useState([])
  const [form, setForm] = useState(FORM_VIDE)
  const [editingId, setEditingId] = useState(null) // null = mode ajout
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      const [r, p, s, m] = await Promise.all([
        supabase.from('rendez_vous').select(SELECT_RDV)
          .order('date_rdv', { ascending: false }),
        supabase.from('patients').select('id, nom').order('nom'),
        supabase.from('statuts').select('id, libelle'),
        supabase.from('moyens_paiement').select('id, libelle'),
      ])

      const err = r.error || p.error || s.error || m.error
      if (err) setError(err.message)
      else {
        setRdvs(r.data)
        setPatients(p.data)
        setStatuts(s.data)
        setMoyens(m.data)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Passer en mode modification : on pré-remplit le formulaire
  function startEdit(r) {
    setEditingId(r.id)
    setError('')
    setForm({
      date_rdv: r.date_rdv ?? '',
      patient_id: r.patient_id != null ? String(r.patient_id) : '',
      statut_id: r.statut_id != null ? String(r.statut_id) : '',
      facture: r.facture ?? '',
      moyen_paiement_id:
        r.moyen_paiement_id != null ? String(r.moyen_paiement_id) : '',
      commentaire: r.commentaire ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(FORM_VIDE)
    setError('')
  }

  // CREATE ou UPDATE selon le mode
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      date_rdv: form.date_rdv,
      patient_id: Number(form.patient_id),
      statut_id: form.statut_id ? Number(form.statut_id) : null,
      facture: form.facture !== '' ? Number(form.facture) : null,
      moyen_paiement_id: form.moyen_paiement_id
        ? Number(form.moyen_paiement_id)
        : null,
      commentaire: form.commentaire || null,
    }

    if (editingId) {
      // UPDATE : on ne touche pas à rdv_pris_par (celui qui a créé le rdv)
      const { data, error } = await supabase
        .from('rendez_vous')
        .update(payload)
        .eq('id', editingId)
        .select(SELECT_RDV)
        .single()

      if (error) setError(error.message)
      else {
        setRdvs((prev) => prev.map((r) => (r.id === editingId ? data : r)))
        cancelEdit()
      }
    } else {
      // CREATE
      const { data, error } = await supabase
        .from('rendez_vous')
        .insert({ ...payload, rdv_pris_par: email })
        .select(SELECT_RDV)
        .single()

      if (error) setError(error.message)
      else {
        setRdvs((prev) => [data, ...prev])
        setForm(FORM_VIDE)
      }
    }
  }

  // DELETE
  async function handleDelete(id) {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    const { error } = await supabase.from('rendez_vous').delete().eq('id', id)
    if (error) setError(error.message)
    else {
      setRdvs((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) cancelEdit()
    }
  }

  if (loading) return <p>Chargement...</p>

  return (
    <div>
      <h2>{editingId ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>

      <form onSubmit={handleSubmit}>
        <input type="date" name="date_rdv" value={form.date_rdv}
          onChange={handleChange} required />

        <select name="patient_id" value={form.patient_id}
          onChange={handleChange} required>
          <option value="">Patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>

        <select name="statut_id" value={form.statut_id} onChange={handleChange}>
          <option value="">Statut...</option>
          {statuts.map((s) => (
            <option key={s.id} value={s.id}>{s.libelle}</option>
          ))}
        </select>

        <input type="number" step="0.01" name="facture" placeholder="Facture (€)"
          value={form.facture} onChange={handleChange} />

        <select name="moyen_paiement_id" value={form.moyen_paiement_id}
          onChange={handleChange}>
          <option value="">Moyen de paiement...</option>
          {moyens.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </select>

        <input name="commentaire" placeholder="Commentaire"
          value={form.commentaire} onChange={handleChange} />

        <button type="submit">
          {editingId ? 'Enregistrer' : 'Ajouter'}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit}>Annuler</button>
        )}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Date</th><th>Patient</th><th>Statut</th>
            <th>Facture</th><th>Paiement</th><th>Pris par</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rdvs.map((r) => (
            <tr
              key={r.id}
              style={{ background: r.id === editingId ? '#fff3cd' : 'none' }}
            >
              <td>{r.date_rdv}</td>
              <td>{r.patients?.nom}</td>
              <td>{r.statuts?.libelle}</td>
              <td>{r.facture != null ? `${r.facture} €` : ''}</td>
              <td>{r.moyens_paiement?.libelle}</td>
              <td>{r.rdv_pris_par}</td>
              <td>
                <button onClick={() => startEdit(r)}>Modifier</button>{' '}
                <button onClick={() => handleDelete(r.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RdvList