import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'
import {
  getDispatch,
  getForwardingNote,
  getForwardingNotes,
  getVans,
  saveDispatch,
} from '../api/kalapatru'
import ForwardingNotePrintModal from '../components/ForwardingNotePrintModal'
import { formatDisplayDate, toServerDate, todayInput } from '../utils/dates'

function billTotal(values) {
  if (!values) return 0
  return String(values)
    .split('+')
    .reduce((sum, part) => sum + (parseFloat(part) || 0), 0)
}

function casesLabel(fn) {
  if (fn.regularCases && fn.bigCases) {
    return `${fn.cases}(R-${fn.regularCases} B-${fn.bigCases})`
  }
  if (fn.regularCases) return `${fn.cases}(R-${fn.regularCases})`
  if (fn.bigCases) return `${fn.cases}(B-${fn.bigCases})`
  return fn.cases || ''
}

export default function DispatchPage() {
  const { canWrite } = useAuth()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [filter, setFilter] = useState({
    fromDate: todayInput(),
    toDate: todayInput(),
    transporterName: '',
  })
  const [fnId, setFnId] = useState('')
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState([])
  const [viewName, setViewName] = useState('grid')
  const [vans, setVans] = useState([])
  const [vanNo, setVanNo] = useState('')
  const [driver, setDriver] = useState('')
  const [date, setDate] = useState(todayInput())
  const [remarks, setRemarks] = useState('')
  const [dispatchId, setDispatchId] = useState(null)
  const [vanPopup, setVanPopup] = useState(false)
  const [previewFn, setPreviewFn] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedNotes = useMemo(() => {
    const byId = new Map(notes.map((n) => [n.id, n]))
    return selected.map((id) => byId.get(id)).filter(Boolean)
  }, [notes, selected])

  const filteredNotes = useMemo(() => {
    const q = filter.transporterName.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((fn) => {
      const hay = [
        fn.id,
        fn.transporter?.name,
        fn.customer?.name,
        fn.customer?.city,
        fn.marka,
        fn.transporterStation,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [notes, filter.transporterName])

  async function loadNotes() {
    setLoading(true)
    setError('')
    try {
      const data = await getForwardingNotes({
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        transporterName: '',
      })
      setNotes(data || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
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
        const linked = data.forwardingNote || []
        setSelected(linked.map((fn) => fn.id))
        setNotes((prev) => {
          const merged = [...linked]
          const ids = new Set(merged.map((n) => n.id))
          prev.forEach((n) => {
            if (!ids.has(n.id)) merged.push(n)
          })
          return merged
        })
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [editId])

  function requireVanDetails() {
    if (!vanNo || !driver) {
      setError('Please enter Van Details first')
      setVanPopup(true)
      return false
    }
    return true
  }

  function toggleNote(fn) {
    setError('')
    if (!requireVanDetails()) return
    setSelected((prev) =>
      prev.includes(fn.id) ? prev.filter((x) => x !== fn.id) : [fn.id, ...prev],
    )
  }

  function removeNote(fn) {
    setSelected((prev) => prev.filter((id) => id !== fn.id))
  }

  async function applyFnId() {
    if (!fnId) {
      setError('Enter a forwarding number id')
      return
    }
    setLoading(true)
    setError('')
    try {
      const note = await getForwardingNote(fnId)
      setNotes([note])
      setMessage(`Loaded forwarding note #${note.id}`)
    } catch (err) {
      setError(getErrorMessage(err, 'Forwarding note not found'))
    } finally {
      setLoading(false)
    }
  }

  async function openPrintPreview(fn, event) {
    event?.stopPropagation?.()
    event?.preventDefault?.()
    setError('')
    try {
      // List payloads can be partial — fetch full note for print slip
      const full = await getForwardingNote(fn.id)
      setPreviewFn(full || fn)
    } catch {
      setPreviewFn(fn)
    }
  }

  async function handleSave() {
    setError('')
    setMessage('')
    if (!canWrite) {
      setError('Your role is read-only')
      return
    }
    if (!requireVanDetails()) return
    if (selected.length === 0) {
      setError('Select at least one forwarding note')
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
    <section className="panel dispatch-panel">
      <h2 className="page-title">Dispatch</h2>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="dispatch-toolbar">
        <div className="fn-id-bar">
          <label htmlFor="fnIdInput">Forwarding Number Id</label>
          <input
            id="fnIdInput"
            type="number"
            value={fnId}
            onChange={(e) => setFnId(e.target.value)}
          />
          <button type="button" className="btn primary small" onClick={applyFnId} disabled={loading}>
            Apply
          </button>
          <button
            type="button"
            className="btn primary small"
            onClick={() => {
              setFnId('')
              loadNotes()
            }}
          >
            Reset
          </button>
        </div>
        <button type="button" className="btn primary" onClick={() => setVanPopup(true)}>
          Add Van Details
        </button>
      </div>

      <div className="dispatch-split">
        <aside className="dispatch-left">
          <div className="dispatch-filters">
            <div className="date-pair">
              <div>
                <label>From Date</label>
                <input
                  type="date"
                  value={filter.fromDate}
                  onChange={(e) => setFilter((f) => ({ ...f, fromDate: e.target.value }))}
                />
              </div>
              <div>
                <label>To Date</label>
                <input
                  type="date"
                  value={filter.toDate}
                  onChange={(e) => setFilter((f) => ({ ...f, toDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="filter-field">
              <label>Filter</label>
              <input
                value={filter.transporterName}
                onChange={(e) => setFilter((f) => ({ ...f, transporterName: e.target.value }))}
                onBlur={loadNotes}
              />
            </div>
            <button type="button" className="btn primary small" onClick={loadNotes} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          <div className="view-toggle">
            <button
              type="button"
              className={viewName === 'list' ? 'active' : ''}
              onClick={() => setViewName('list')}
            >
              List View
            </button>
            <button
              type="button"
              className={viewName === 'grid' ? 'active' : ''}
              onClick={() => setViewName('grid')}
            >
              Grid View
            </button>
          </div>

          {viewName === 'grid' ? (
            <div className="fn-grid">
              {filteredNotes.map((fn) => {
                const active = selected.includes(fn.id)
                return (
                  <div
                    key={fn.id}
                    className={`fn-grid-cell ${active ? 'selected' : ''} ${fn.isDispatched ? 'disabled' : ''}`}
                  >
                    <button
                      type="button"
                      className="fn-id-btn"
                      disabled={!canWrite || fn.isDispatched}
                      onClick={() => toggleNote(fn)}
                    >
                      {fn.id}
                    </button>
                    <button
                      type="button"
                      className="fn-print-btn"
                      title="Print forwarding note"
                      aria-label={`Print forwarding note ${fn.id}`}
                      onClick={(e) => openPrintPreview(fn, e)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v7h4v4h10v-4h4v-7c0-1.1-.9-2-2-2zm-3 11H8v-4h8v4zm0-11H8V5h8v3zm2 4.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                        />
                      </svg>
                    </button>
                  </div>
                )
              })}
              {filteredNotes.length === 0 && (
                <div className="muted empty-notes">No open forwarding notes</div>
              )}
            </div>
          ) : (
            <ul className="fn-list">
              {filteredNotes.map((fn) => {
                const active = selected.includes(fn.id)
                return (
                  <li key={fn.id} className={active ? 'selected' : ''}>
                    <label>
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={!canWrite || fn.isDispatched}
                        onChange={() => toggleNote(fn)}
                      />
                      <span>
                        {fn.id} -- {fn.transporter?.name} - {fn.customer?.name} -{' '}
                        {fn.customer?.city} - {fn.marka}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="fn-print-btn inline"
                      title="Print forwarding note"
                      aria-label={`Print forwarding note ${fn.id}`}
                      onClick={(e) => openPrintPreview(fn, e)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v7h4v4h10v-4h4v-7c0-1.1-.9-2-2-2zm-3 11H8v-4h8v4zm0-11H8V5h8v3zm2 4.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                        />
                      </svg>
                    </button>
                  </li>
                )
              })}
              {filteredNotes.length === 0 && (
                <li className="muted">No open forwarding notes</li>
              )}
            </ul>
          )}
        </aside>

        <section className="dispatch-right" id="vanDetails_id">
          <div className="dispatch-brand">
            <img src="/logo.png" alt="Kalpataru" />
            <div className="adrs">
              Kalpataru Tower Patna Gaya Road Elahibagh
              <br />
              Patna-800007
            </div>
          </div>

          <div className="van-meta">
            <div className="van-meta-row">
              <div>
                <label>Date: </label>
                <span>{date ? new Date(date).toDateString() : ''}</span>
              </div>
              <div>
                <label>Van No.: </label>
                <span>{vanNo}</span>
              </div>
            </div>
            <div className="van-meta-row">
              <div>
                <label>Driver Name: </label>
                <span>{driver}</span>
              </div>
            </div>
            <div className="van-meta-row">
              <div>
                <label>Remarks: </label>
                <span>{remarks}</span>
              </div>
            </div>
          </div>

          <div className="dispatch-divider" />

          <div className="dispatch-table-wrap">
            <table className="data-table dispatch-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transport Name</th>
                  <th>Station / Place</th>
                  <th>Bill No.</th>
                  <th>Bill Date.</th>
                  <th>Values</th>
                  <th>Cases</th>
                  <th>Pvt. Marka</th>
                  <th>Permit No.</th>
                  <th>Customer name</th>
                  <th>Customer City</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedNotes.map((fn) => (
                  <tr key={fn.id}>
                    <td>{formatDisplayDate(fn.fnDate)}</td>
                    <td>{fn.transporter?.name}</td>
                    <td>{fn.transporterStation || fn.transporter?.city}</td>
                    <td>{fn.billNo}</td>
                    <td>{fn.billDates}</td>
                    <td>{billTotal(fn.billValues)}</td>
                    <td>{casesLabel(fn)}</td>
                    <td>{fn.marka}</td>
                    <td>{fn.permitNo}</td>
                    <td>{fn.customer?.name}</td>
                    <td>{fn.customer?.city}</td>
                    <td>
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => removeNote(fn)}
                        disabled={!canWrite}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="classic-actions">
            <button
              type="button"
              className="btn primary"
              disabled={!canWrite || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </section>
      </div>

      {vanPopup && (
        <div className="modal-backdrop" onClick={() => setVanPopup(false)}>
          <div className="modal van-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Enter Van Details</h3>
              <button type="button" className="link-btn" onClick={() => setVanPopup(false)}>
                Close
              </button>
            </div>
            <div className="van-form">
              <label>
                Van No.
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
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label>
                Driver Name
                <input value={driver} onChange={(e) => setDriver(e.target.value)} />
              </label>
              <label>
                Remarks
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </label>
              <button type="button" className="btn primary" onClick={() => setVanPopup(false)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFn && (
        <ForwardingNotePrintModal note={previewFn} onClose={() => setPreviewFn(null)} />
      )}
    </section>
  )
}
