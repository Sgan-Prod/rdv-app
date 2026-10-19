import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'

function RefTable({ table, column, titre }) {
  const [rows, setRows] = useState([])
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from(table).select(`id, ${column}`).order(column)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows(data)
      })
  }, [table, column])

  async function add(e) {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase
      .from(table).insert({ [column]: value.trim() }).select().single()
    if (error) setError(error.message)
    else {
      setRows((prev) => [...prev, data].sort((a, b) => a[column].localeCompare(b[column])))
      setValue('')
    }
  }

  async function rename(row) {
    const nouveau = prompt('Nouveau nom :', row[column])
    if (!nouveau || nouveau.trim() === row[column]) return
    setError('')
    const { data, error } = await supabase
      .from(table).update({ [column]: nouveau.trim() }).eq('id', row.id).select().single()
    if (error) setError(error.message)
    else setRows((prev) => prev.map((r) => (r.id === row.id ? data : r)))
  }

  async function remove(row) {
    if (!confirm(`Supprimer « ${row[column]} » ?`)) return
    setError('')
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error)
      setError('Suppression impossible : cet élément est probablement utilisé ailleurs. ' + error.message)
    else setRows((prev) => prev.filter((r) => r.id !== row.id))
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{titre}</h2>

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input value={value} onChange={(e) => setValue(e.target.value)} required
          placeholder="Ajouter..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        <button type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Ajouter
        </button>
      </form>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2">
            <span>{r[column]}</span>
            <span className="text-sm">
              <button onClick={() => rename(r)} className="mr-3 text-indigo-600 hover:underline">Renommer</button>
              <button onClick={() => remove(r)} className="text-red-600 hover:underline">Supprimer</button>
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-slate-400">Aucun élément</li>}
      </ul>
    </section>
  )
}

export default RefTable