import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { getDispatches } from '../api/kalapatru'
import { formatDisplayDate, todayInput } from '../utils/dates'

export default function Dispatches() {
  const [fromDate, setFromDate] = useState(todayInput())
  const [toDate, setToDate] = useState(todayInput())
  const [rows, setRows] = useState([])
  const [active, setActive] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getDispatches(fromDate, toDate)
      setRows([...(data || [])].reverse())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function totalCases(dispatch) {
    return (dispatch.forwardingNote || []).reduce((sum, fn) => {
      const n = parseInt(fn.cases, 10)
      return sum + (Number.isNaN(n) ? 0 : n)
    }, 0)
  }

  return (
    <section className="panel">
      <h2 className="page-title">Dispatches</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="filter-row">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button type="button" className="btn ghost" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Filter'}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Van</th>
            <th>Driver</th>
            <th>Cases</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{formatDisplayDate(d.date)}</td>
              <td>{d.vanNo}</td>
              <td>{d.name}</td>
              <td>{totalCases(d)}</td>
              <td>{(d.forwardingNote || []).length}</td>
              <td className="row-actions">
                <button type="button" className="link-btn" onClick={() => setActive(d)}>
                  View
                </button>
                {!d.isLocked && (
                  <Link to={`/dispatch?id=${d.id}`} className="link-btn">
                    Edit
                  </Link>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No dispatches for this range
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Dispatch #{active.id}</h3>
              <button type="button" className="link-btn" onClick={() => setActive(null)}>
                Close
              </button>
            </div>
            <p>
              {formatDisplayDate(active.date)} · Van {active.vanNo} · {active.name}
            </p>
            {active.remarks && <p className="muted">{active.remarks}</p>}
            <table className="data-table">
              <thead>
                <tr>
                  <th>FN</th>
                  <th>Transporter</th>
                  <th>Customer</th>
                  <th>Marka</th>
                  <th>Cases</th>
                </tr>
              </thead>
              <tbody>
                {(active.forwardingNote || []).map((fn) => (
                  <tr key={fn.id}>
                    <td>{fn.id}</td>
                    <td>{fn.transporter?.name}</td>
                    <td>{fn.customer?.name}</td>
                    <td>{fn.marka}</td>
                    <td>{fn.cases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
