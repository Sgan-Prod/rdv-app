import { useState, useEffect } from 'react'
import { Pencil, Archive, ArchiveRestore, Check, X } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'

const SELECT_PATIENT =
  'id, nom, actif, etablissement_id, etablissements(nom, actif)'

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

// Un patient est considéré archivé s'il l'est lui-même
// ou si son établissement est archivé
const estArchive = (p) => !p.actif || p.etablissements?.actif === false

function PatientsList({ profile }) {
  const isAdmin = profile.role === 'admin'

  /* ---------- State ---------- */
  const [patients, setPatients] = useState([])
  const [etabs, setEtabs] = useState([])
  const [nom, setNom] = useState('')
  const [etabId, setEtabId] = useState(
    isAdmin ? '' : String(profile.etablissement_id)
  )
  const [affichage, setAffichage] = useState('actifs') // actifs | archives | tous
  const [recherche, setRecherche] = useState('')
  const [editingId, setEditingId] = useState(null) // patient en cours de modification
  const [editNom, setEditNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* ---------- Chargement : tous les patients ---------- */
  useEffect(() => {
    async function load() {
      const [p, e] = await Promise.all([
        supabase.from('patients').select(SELECT_PATIENT).order('nom'),
        supabase.from('etablissements').select('id, nom, actif').order('nom'),
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

  const trier = (liste) => liste.sort((a, b) => a.nom.localeCompare(b.nom))

  /* ---------- Ajout ---------- */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase
      .from('patients')
      .insert({ nom: nom.trim(), etablissement_id: Number(etabId) })
      .select(SELECT_PATIENT)
      .single()

    if (error) setError(error.message)
    else {
      setPatients((prev) => trier([...prev, data]))
      setNom('')
    }
  }

  /* ---------- Modification du nom (édition en ligne) ---------- */
  function startEdit(p) {
    setEditingId(p.id)
    setEditNom(p.nom)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditNom('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    const nouveau = editNom.trim()
    const patient = patients.find((p) => p.id === editingId)

    // Rien à enregistrer : on referme simplement
    if (!nouveau || nouveau === patient.nom) {
      cancelEdit()
      return
    }

    setError('')
    const { data, error } = await supabase
      .from('patients')
      .update({ nom: nouveau })
      .eq('id', editingId)
      .select(SELECT_PATIENT)
      .single()

    if (error) setError(error.message)
    else {
      setPatients((prev) =>
        trier(prev.map((p) => (p.id === editingId ? data : p)))
      )
      cancelEdit()
    }
  }

  /* ---------- Archiver / restaurer ---------- */
  async function setActif(patient, actif) {
    if (
      !actif &&
      !confirm(`Archiver « ${patient.nom} » ? Ses rendez-vous sont conservés.`)
    )
      return

    setError('')
    const { data, error } = await supabase
      .from('patients')
      .update({ actif })
      .eq('id', patient.id)
      .select(SELECT_PATIENT)
      .single()

    if (error) setError(error.message)
    else
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? data : p)))
  }

  /* ---------- Affichage ---------- */
  if (loading) return <p className="text-slate-500">Chargement...</p>

  const nbArchives = patients.filter(estArchive).length
  const terme = recherche.trim().toLowerCase()

  const patientsAffiches = patients.filter((p) => {
    if (affichage === 'actifs' && estArchive(p)) return false
    if (affichage === 'archives' && !estArchive(p)) return false
    if (
      terme &&
      !p.nom.toLowerCase().includes(terme) &&
      !(p.etablissements?.nom ?? '').toLowerCase().includes(terme)
    )
      return false
    return true
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Formulaire d'ajout */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Patients</h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          {isAdmin && (
            <select
              value={etabId}
              onChange={(e) => setEtabId(e.target.value)}
              required
              className={field}
            >
              <option value="">Établissement...</option>
              {etabs
                .filter((et) => et.actif)
                .map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nom}
                  </option>
                ))}
            </select>
          )}
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du patient"
            required
            className={field}
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Ajouter
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {/* Recherche + filtre actifs / archivés */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un patient..."
          className={`${field} min-w-[12rem] flex-1`}
        />
        <select
          value={affichage}
          onChange={(e) => setAffichage(e.target.value)}
          className={`${field} max-w-[14rem]`}
        >
          <option value="actifs">Patients actifs</option>
          <option value="archives">Archivés ({nbArchives})</option>
          <option value="tous">Tous</option>
        </select>
        <span className="text-sm text-slate-500">
          {patientsAffiches.length} patient
          {patientsAffiches.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {patientsAffiches.map((p) =>
          p.id === editingId ? (
            /* ----- Mode modification : champ + valider / annuler ----- */
            <li key={p.id} className="bg-amber-50 px-4 py-3">
              <form onSubmit={saveEdit} className="flex items-center gap-2">
                <input
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                  autoFocus
                  required
                  className={field}
                />
                <button
                  type="submit"
                  title="Enregistrer"
                  aria-label="Enregistrer"
                  className="rounded-md p-2 text-green-600 hover:bg-green-50"
                >
                  <Check size={18} />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  title="Annuler"
                  aria-label="Annuler"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </form>
            </li>
          ) : (
            /* ----- Mode normal ----- */
            <li
              key={p.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className={estArchive(p) ? 'text-slate-400' : ''}>
                <span className="font-medium">{p.nom}</span>
                {isAdmin && (
                  <span className="ml-2 text-xs text-slate-400">
                    {p.etablissements?.nom}
                  </span>
                )}
                {estArchive(p) && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {p.actif ? 'établissement archivé' : 'archivé'}
                  </span>
                )}
              </span>

              <span className="flex gap-1">
                <button
                  onClick={() => startEdit(p)}
                  title="Modifier le nom"
                  aria-label="Modifier le nom"
                  className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50"
                >
                  <Pencil size={18} />
                </button>

                {!p.actif ? (
                  <button
                    onClick={() => setActif(p, true)}
                    title="Restaurer"
                    aria-label="Restaurer"
                    className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    <ArchiveRestore size={18} />
                  </button>
                ) : p.etablissements?.actif !== false ? (
                  <button
                    onClick={() => setActif(p, false)}
                    title="Archiver"
                    aria-label="Archiver"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <Archive size={18} />
                  </button>
                ) : null}
              </span>
            </li>
          )
        )}

        {patientsAffiches.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-400">
            {affichage === 'archives'
              ? 'Aucun patient archivé'
              : 'Aucun patient'}
          </li>
        )}
      </ul>
    </div>
  )
}

export default PatientsList
