import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { getDispatches } from '../api/kalapatru'
import VanDetailsModal from '../components/VanDetailsModal'
import { formatDdMmYyyy, todayInput } from '../utils/dates'

export default function Dispatches() {
  const [fromDate, setFromDate] = useState(todayInput())
  const [toDate, setToDate] = useState(todayInput())
  const [textFilter, setTextFilter] = useState('')
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

  const filtered = useMemo(() => {
    const q = textFilter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((d) => {
      const hay = [d.id, d.vanNo, d.name, d.remarks, d.date].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rows, textFilter])

  return (
    <section className="panel dispatches-panel">
      <h2 className="page-title">Dispatches</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="dispatches-filters">
        <div className="dispatches-date-row">
          <div className="filter-field">
            <label htmlFor="dispFrom">From Date</label>
            <input
              id="dispFrom"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="dispTo">To Date</label>
            <input
              id="dispTo"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn primary small apply-btn"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
        <div className="filter-field filter-wide">
          <label htmlFor="dispFilter">Filter</label>
          <input
            id="dispFilter"
            type="text"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="dispatch-table-wrap">
        <table className="data-table dispatch-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Van No.</th>
              <th>Driver Name</th>
              <th>Remarks</th>
              <th style={{ width: 70 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{formatDdMmYyyy(d.date)}</td>
                <td>{d.vanNo}{d.vanNo ? '.' : ''}</td>
                <td>{d.name}</td>
                <td>{d.remarks}</td>
                <td className="action-icons">
                  <button
                    type="button"
                    className="icon-btn"
                    title="View"
                    onClick={() => setActive(d)}
                  >
                    <img src="/viewicon.png" alt="View" width={18} height={18} />
                  </button>
                  {!d.isLocked && (
                    <Link to={`/dispatch?id=${d.id}`} className="icon-btn" title="Edit">
                      <img src="/editicon.png" alt="Edit" width={15} height={15} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No dispatches for this range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {active && <VanDetailsModal dispatch={active} onClose={() => setActive(null)} />}
    </section>
  )
}
