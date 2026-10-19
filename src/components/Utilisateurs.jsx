import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'

const field =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

function Utilisateurs({ profile }) {
  const [users, setUsers] = useState([])
  const [etabs, setEtabs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [u, e] = await Promise.all([
        supabase.from('profiles').select('id, email, role, etablissement_id').order('email'),
        supabase.from('etablissements').select('id, nom').order('nom'),
      ])
      if (u.error || e.error) setError((u.error || e.error).message)
      else {
        setUsers(u.data)
        setEtabs(e.data)
      }
    }
    load()
  }, [])

  async function save(id, fields) {
    setError('')
    const { data, error } = await supabase
      .from('profiles').update(fields).eq('id', id).select().single()
    if (error) setError(error.message)
    else setUsers((prev) => prev.map((u) => (u.id === id ? data : u)))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Utilisateurs</h2>
      <p className="text-sm text-slate-500">
        Les comptes se créent dans Supabase (Authentication → Users). Assigne ici leur rôle et leur établissement.
      </p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Établissement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} className={field}
                    disabled={u.id === profile.id}
                    onChange={(e) => save(u.id, { role: e.target.value })}>
                    <option value="responsable">Responsable</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select value={u.etablissement_id ?? ''} className={field}
                    onChange={(e) =>
                      save(u.id, { etablissement_id: e.target.value ? Number(e.target.value) : null })
                    }>
                    <option value="">Aucun</option>
                    {etabs.map((et) => (
                      <option key={et.id} value={et.id}>{et.nom}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Utilisateurs