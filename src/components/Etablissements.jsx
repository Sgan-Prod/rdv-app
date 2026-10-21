import { useState, useEffect } from 'react'
import { Pencil, Archive, ArchiveRestore, Check, X } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'

const field =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

function Etablissements() {
  /* ---------- State ---------- */
  const [etabs, setEtabs] = useState([])
  const [nom, setNom] = useState('')
  const [affichage, setAffichage] = useState('actifs') // actifs | archives | tous
  const [editingId, setEditingId] = useState(null) // établissement en cours de renommage
  const [editNom, setEditNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* ---------- Chargement : tous les établissements ---------- */
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('etablissements')
        .select('id, nom, actif')
        .order('nom')
      if (error) setError(error.message)
      else setEtabs(data)
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
      .from('etablissements')
      .insert({ nom: nom.trim() })
      .select('id, nom, actif')
      .single()

    if (error)
      setError(
        error.code === '23505'
          ? 'Un établissement porte déjà ce nom.'
          : error.message
      )
    else {
      setEtabs((prev) => trier([...prev, data]))
      setNom('')
    }
  }

  /* ---------- Renommer (édition en ligne) ---------- */
  function startEdit(etab) {
    setEditingId(etab.id)
    setEditNom(etab.nom)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditNom('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    const nouveau = editNom.trim()
    const etab = etabs.find((x) => x.id === editingId)

    // Rien à enregistrer : on referme simplement
    if (!nouveau || nouveau === etab.nom) {
      cancelEdit()
      return
    }

    setError('')
    const { data, error } = await supabase
      .from('etablissements')
      .update({ nom: nouveau })
      .eq('id', editingId)
      .select('id, nom, actif')
      .single()

    if (error)
      setError(
        error.code === '23505'
          ? 'Un établissement porte déjà ce nom.'
          : error.message
      )
    else {
      setEtabs((prev) =>
        trier(prev.map((x) => (x.id === editingId ? data : x)))
      )
      cancelEdit()
    }
  }

  /* ---------- Archiver / restaurer ---------- */
  async function setActif(etab, actif) {
    if (
      !actif &&
      !confirm(
        `Archiver « ${etab.nom} » ? Ses patients et rendez-vous sont conservés.`
      )
    )
      return

    setError('')
    const { data, error } = await supabase
      .from('etablissements')
      .update({ actif })
      .eq('id', etab.id)
      .select('id, nom, actif')
      .single()

    if (error) setError(error.message)
    else setEtabs((prev) => prev.map((x) => (x.id === etab.id ? data : x)))
  }

  /* ---------- Affichage ---------- */
  if (loading) return <p className="text-slate-500">Chargement...</p>

  const nbArchives = etabs.filter((x) => !x.actif).length

  const etabsAffiches = etabs.filter((x) => {
    if (affichage === 'actifs') return x.actif
    if (affichage === 'archives') return !x.actif
    return true
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Formulaire d'ajout */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Établissements</h2>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom de l'établissement"
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

      {/* Filtre actifs / archivés */}
      <div className="flex items-center justify-between gap-3">
        <select
          value={affichage}
          onChange={(e) => setAffichage(e.target.value)}
          className={`${field} max-w-[14rem]`}
        >
          <option value="actifs">Établissements actifs</option>
          <option value="archives">Archivés ({nbArchives})</option>
          <option value="tous">Tous</option>
        </select>
        <span className="text-sm text-slate-500">
          {etabsAffiches.length} établissement
          {etabsAffiches.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {etabsAffiches.map((x) =>
          x.id === editingId ? (
            /* ----- Mode modification : champ + valider / annuler ----- */
            <li key={x.id} className="bg-amber-50 px-4 py-3">
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
          <li
            key={x.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className={x.actif ? '' : 'text-slate-400'}>
              <span className="font-medium">{x.nom}</span>
              {!x.actif && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  archivé
                </span>
              )}
            </span>

            <span className="flex gap-1">
              <button
                onClick={() => startEdit(x)}
                title="Modifier le nom"
                aria-label="Modifier le nom"
                className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil size={18} />
              </button>

              {x.actif ? (
                <button
                  onClick={() => setActif(x, false)}
                  title="Archiver"
                  aria-label="Archiver"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                  <Archive size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setActif(x, true)}
                  title="Restaurer"
                  aria-label="Restaurer"
                  className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50"
                >
                  <ArchiveRestore size={18} />
                </button>
              )}
            </span>
          </li>
          )
        )}

        {etabsAffiches.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-400">
            {affichage === 'archives'
              ? 'Aucun établissement archivé'
              : 'Aucun établissement'}
          </li>
        )}
      </ul>
    </div>
  )
}

export default Etablissements
