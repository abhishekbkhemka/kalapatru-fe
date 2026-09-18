import { useEffect, useMemo, useState } from 'react'
import {
  getCustomers,
  getNotificationLedger,
  updateCustomerNotify,
} from '../api/kalapatru'
import { getErrorMessage } from '../api/client'
import { formatDisplayDate, todayInput } from '../utils/dates'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({
    notifyWhatsApp: false,
    whatsappNumber1: '',
    whatsappNumber2: '',
  })
  const [ledgerFrom, setLedgerFrom] = useState(todayInput())
  const [ledgerTo, setLedgerTo] = useState(todayInput())
  const [ledger, setLedger] = useState({ results: [], summary: null })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingLedger, setLoadingLedger] = useState(false)

  async function loadCustomers() {
    try {
      setCustomers(await getCustomers())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.id, c.name, c.city, c.label, c.whatsappNumber1, c.whatsappNumber2]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [customers, query])

  function selectCustomer(c) {
    setSelectedId(c.id)
    setForm({
      notifyWhatsApp: Boolean(c.notifyWhatsApp),
      whatsappNumber1: c.whatsappNumber1 || '',
      whatsappNumber2: c.whatsappNumber2 || '',
    })
    setMessage('')
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateCustomerNotify(selectedId, form)
      setMessage('Customer notification settings saved')
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
      selectCustomer(updated)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  async function loadLedger() {
    setLoadingLedger(true)
    setError('')
    try {
      const data = await getNotificationLedger({
        customerId: selectedId || undefined,
        fromDate: ledgerFrom,
        toDate: ledgerTo,
      })
      setLedger(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load ledger'))
    } finally {
      setLoadingLedger(false)
    }
  }

  const selected = customers.find((c) => c.id === selectedId)

  return (
    <section className="panel">
      <h2 className="page-title">Customers & Notifications</h2>
      <p className="muted">Set WhatsApp notify default and up to 2 numbers. Review the send ledger for billing.</p>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="customers-layout">
        <div className="customers-list-panel">
          <label>
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, city, phone…"
            />
          </label>
          <ul className="customers-list">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`customer-row ${selectedId === c.id ? 'active' : ''}`}
                  onClick={() => selectCustomer(c)}
                >
                  <strong>{c.name}</strong>
                  <span>{c.city || '—'}</span>
                  <em>{c.notifyWhatsApp ? 'Notify on' : 'Notify off'}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="customers-edit-panel">
          {selected ? (
            <form className="form-grid" onSubmit={handleSave}>
              <h3>{selected.name}</h3>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.notifyWhatsApp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyWhatsApp: e.target.checked }))
                  }
                />
                Default: send WhatsApp when LR is attached
              </label>
              <label>
                WhatsApp number 1
                <input
                  value={form.whatsappNumber1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whatsappNumber1: e.target.value }))
                  }
                  placeholder="9198XXXXXXXX"
                  inputMode="tel"
                />
              </label>
              <label>
                WhatsApp number 2
                <input
                  value={form.whatsappNumber2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whatsappNumber2: e.target.value }))
                  }
                  placeholder="Optional second number"
                  inputMode="tel"
                />
              </label>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </form>
          ) : (
            <p className="muted">Select a customer to edit notification settings.</p>
          )}

          <div className="ledger-section">
            <h3>Notification ledger</h3>
            <div className="inline-row wrap">
              <label>
                From
                <input type="date" value={ledgerFrom} onChange={(e) => setLedgerFrom(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={ledgerTo} onChange={(e) => setLedgerTo(e.target.value)} />
              </label>
              <button type="button" className="btn" onClick={loadLedger} disabled={loadingLedger}>
                {loadingLedger ? 'Loading…' : selectedId ? 'Load for customer' : 'Load all'}
              </button>
            </div>
            {ledger.summary && (
              <p className="ledger-summary">
                Total {ledger.summary.total} · Sent {ledger.summary.sent} · Failed {ledger.summary.failed}
              </p>
            )}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Customer</th>
                    <th>FN</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {(ledger.results || []).map((row) => (
                    <tr key={row.id}>
                      <td>{formatDisplayDate(row.createdAt) || row.createdAt}</td>
                      <td>{row.customerName}</td>
                      <td>{row.forwardingNoteId || '—'}</td>
                      <td>{row.toNumber || '—'}</td>
                      <td>{row.status}</td>
                      <td>{row.errorMessage || row.provider || '—'}</td>
                    </tr>
                  ))}
                  {!ledger.results?.length && (
                    <tr>
                      <td colSpan={6} className="muted">No rows — choose dates and load.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
