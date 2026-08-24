import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'
import {
  getDispatch,
  getForwardingNotes,
  getVans,
  saveDispatch,
} from '../api/kalapatru'
import { formatDisplayDate, toServerDate, todayInput } from '../utils/dates'

export default function DispatchPage() {
  const { canWrite } = useAuth()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [filter, setFilter] = useState({
    fromDate: '',
    toDate: '',
    transporterName: '',
  })
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState([])
  const [vans, setVans] = useState([])
  const [vanNo, setVanNo] = useState('')
  const [driver, setDriver] = useState('')
  const [date, setDate] = useState(todayInput())
  const [remarks, setRemarks] = useState('')
  const [dispatchId, setDispatchId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadNotes() {
    try {
      const data = await getForwardingNotes(filter)
      setNotes(data || [])
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadNotes()
    getVans()
      .then((data) => setVans(data || []))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!editId) return
    getDispatch(editId)
      .then((data) => {
        setDispatchId(data.id)
        setVanNo(data.vanNo || '')
        setDriver(data.name || '')
        setRemarks(data.remarks || '')
        setDate(data.date ? String(data.date).slice(0, 10) : todayInput())
        setSelected((data.forwardingNote || []).map((fn) => fn.id))
        setNotes((prev) => {
          const merged = [...(data.forwardingNote || [])]
          const ids = new Set(merged.map((n) => n.id))
          prev.forEach((n) => {
            if (!ids.has(n.id)) merged.push(n)
          })
          return merged
        })
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [editId])

  const selectedNotes = useMemo(
    () => notes.filter((n) => selected.includes(n.id)),
    [notes, selected],
  )

  function toggleNote(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSave() {
    setError('')
    setMessage('')
    if (!canWrite) {
      setError('Your role is read-only')
      return
    }
    if (!vanNo || !driver || selected.length === 0) {
      setError('Van number, driver and at least one forwarding note are required')
      return
    }
    setSaving(true)
    try {
      const saved = await saveDispatch(
        {
          date: toServerDate(date),
          vanNo,
          name: driver,
          remarks,
          forwardingNotes: selected,
        },
        dispatchId,
      )
      setDispatchId(saved.id)
      setMessage(`Dispatch #${saved.id} saved`)
      await loadNotes()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save dispatch'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="page-title">Dispatch</h2>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="split">
        <div className="split-left">
          <div className="filter-row">
            <input
              placeholder="Transporter"
              value={filter.transporterName}
              onChange={(e) =>
                setFilter((f) => ({ ...f, transporterName: e.target.value }))
              }
            />
            <input
              type="date"
              value={filter.fromDate}
              onChange={(e) => setFilter((f) => ({ ...f, fromDate: e.target.value }))}
            />
            <input
              type="date"
              value={filter.toDate}
              onChange={(e) => setFilter((f) => ({ ...f, toDate: e.target.value }))}
            />
            <button type="button" className="btn ghost" onClick={loadNotes}>
              Filter
            </button>
          </div>

          <ul className="note-list">
            {notes.map((fn) => (
              <li key={fn.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(fn.id)}
                    onChange={() => toggleNote(fn.id)}
                    disabled={!canWrite}
                  />
                  <span>
                    #{fn.id} · {fn.transporter?.name} · {fn.marka} ·{' '}
                    {formatDisplayDate(fn.fnDate)} · {fn.cases} cases
                  </span>
                </label>
              </li>
            ))}
            {notes.length === 0 && <li className="muted">No open forwarding notes</li>}
          </ul>
        </div>

        <div className="split-right">
          <div className="form-grid compact">
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Van No
              <input
                list="van-list"
                value={vanNo}
                onChange={(e) => {
                  const value = e.target.value
                  setVanNo(value)
                  const match = vans.find((v) => v.vanNo === value)
                  if (match?.name) setDriver(match.name)
                }}
              />
              <datalist id="van-list">
                {vans.map((v, i) => (
                  <option key={`${v.vanNo}-${i}`} value={v.vanNo}>
                    {v.label || v.name}
                  </option>
                ))}
              </datalist>
            </label>
            <label>
              Driver
              <input value={driver} onChange={(e) => setDriver(e.target.value)} />
            </label>
            <label className="span-2">
              Remarks
              <input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Transporter</th>
                <th>Marka</th>
                <th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {selectedNotes.map((fn) => (
                <tr key={fn.id}>
                  <td>{fn.id}</td>
                  <td>{fn.transporter?.name}</td>
                  <td>{fn.marka}</td>
                  <td>{fn.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={!canWrite || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : dispatchId ? 'Update Dispatch' : 'Create Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
