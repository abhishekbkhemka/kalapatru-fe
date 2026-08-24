import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'
import {
  addForwardingNote,
  getCustomers,
  getSettings,
  getTransporters,
} from '../api/kalapatru'
import { toServerDate, todayInput } from '../utils/dates'

const emptyForm = () => ({
  fnDate: todayInput(),
  transporterId: '',
  transporterStation: '',
  customerId: '',
  customerName: '',
  customerCity: '',
  billNumber: '',
  billDate: '',
  billDates: [],
  billValues: '',
  regularCases: '',
  bigCases: '',
  cases: '',
  marka: '',
  permitNo: '',
  commodity: '',
  companyId: '',
})

export default function ForwardingNote() {
  const { canWrite } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [transporters, setTransporters] = useState([])
  const [customers, setCustomers] = useState([])
  const [companies, setCompanies] = useState([])
  const [commodities, setCommodities] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customerLocked, setCustomerLocked] = useState(false)

  useEffect(() => {
    Promise.all([getTransporters(), getCustomers(), getSettings()])
      .then(([t, c, s]) => {
        setTransporters(t || [])
        setCustomers(c || [])
        setCompanies(s.companies || [])
        setCommodities(s.commodities || [])
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const stations = useMemo(() => {
    const t = transporters.find((x) => String(x.id) === String(form.transporterId))
    return t?.stations || []
  }, [transporters, form.transporterId])

  const totalBillValue = useMemo(() => {
    if (!form.billValues) return 0
    return String(form.billValues)
      .split('+')
      .reduce((sum, part) => sum + (parseFloat(part) || 0), 0)
  }, [form.billValues])

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'regularCases' || field === 'bigCases') {
        const regular = parseInt(field === 'regularCases' ? value : prev.regularCases, 10) || 0
        const big = parseInt(field === 'bigCases' ? value : prev.bigCases, 10) || 0
        next.cases = String(regular + big)
      }
      return next
    })
  }

  function addBillDate() {
    if (!form.billDate) {
      setError('Please select a bill date')
      return
    }
    const formatted = toServerDate(form.billDate)
    setForm((prev) => ({
      ...prev,
      billDates: [...prev.billDates, formatted],
      billDate: '',
    }))
    setError('')
  }

  function selectCustomer(customer) {
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name || '',
      customerCity: customer.city || '',
    }))
    setCustomerLocked(true)
  }

  function clearCustomer() {
    setForm((prev) => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerCity: '',
    }))
    setCustomerLocked(false)
  }

  async function handleSave(andPrint = false) {
    setError('')
    setMessage('')

    if (!canWrite) {
      setError('Your role is read-only')
      return
    }
    if (!form.fnDate || !form.transporterId || !form.transporterStation) {
      setError('Forwarding date, transporter and station are required')
      return
    }
    if (!form.customerId && (!form.customerName || !form.customerCity)) {
      setError('Customer name and place are required')
      return
    }
    if (!form.billValues || !form.cases || !form.marka) {
      setError('Bill value, cases and marka are required')
      return
    }

    const payload = {
      fnDate: toServerDate(form.fnDate),
      billValues: form.billValues,
      billNo: form.billNumber,
      regularCases: form.regularCases,
      bigCases: form.bigCases,
      cases: form.cases,
      marka: form.marka,
      permitNo: form.permitNo,
      commodity: form.commodity,
      companyId: form.companyId || undefined,
      transporterStation: form.transporterStation,
      transporter_id: form.transporterId,
      billDates: form.billDates,
    }

    if (form.customerId) {
      payload.customer_id = form.customerId
    } else {
      payload.customer = { name: form.customerName, city: form.customerCity }
    }

    setSaving(true)
    try {
      const saved = await addForwardingNote(payload)
      setMessage(`Saved forwarding note #${saved.id}`)
      setForm(emptyForm())
      clearCustomer()
      if (andPrint) {
        window.print()
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save forwarding note'))
    } finally {
      setSaving(false)
    }
  }

  const filteredCustomers = customers.filter((c) => {
    if (!form.customerName || customerLocked) return true
    return String(c.label || c.name || '')
      .toLowerCase()
      .includes(form.customerName.toLowerCase())
  }).slice(0, 8)

  return (
    <section className="panel">
      <h2 className="page-title">Forwarding Note</h2>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave(false)
        }}
      >
        <label>
          Forwarding Date *
          <input
            type="date"
            value={form.fnDate}
            onChange={(e) => update('fnDate', e.target.value)}
          />
        </label>

        <label>
          Transport Name *
          <select
            value={form.transporterId}
            onChange={(e) => {
              update('transporterId', e.target.value)
              update('transporterStation', '')
            }}
          >
            <option value="">Select transporter</option>
            {transporters.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Station / Place *
          <select
            value={form.transporterStation}
            onChange={(e) => update('transporterStation', e.target.value)}
          >
            <option value="">Select station</option>
            {stations.map((s) => (
              <option key={s.label || s.id} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="span-2">
          Customer Name *
          <div className="inline-row">
            <input
              style={{ textTransform: 'uppercase' }}
              value={form.customerName}
              disabled={customerLocked}
              onChange={(e) => update('customerName', e.target.value)}
              list="customer-suggestions"
            />
            <button type="button" className="btn ghost" onClick={clearCustomer}>
              Clear
            </button>
          </div>
          <datalist id="customer-suggestions">
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          {!customerLocked && form.customerName && (
            <ul className="suggest-list">
              {filteredCustomers.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => selectCustomer(c)}>
                    {c.label || `${c.name} ${c.city || ''}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>

        <label>
          Customer Station / Place *
          <input
            style={{ textTransform: 'uppercase' }}
            value={form.customerCity}
            disabled={customerLocked}
            onChange={(e) => update('customerCity', e.target.value)}
          />
        </label>

        <label>
          Bill No
          <input value={form.billNumber} onChange={(e) => update('billNumber', e.target.value)} />
        </label>

        <label>
          Bill Date
          <div className="inline-row">
            <input
              type="date"
              value={form.billDate}
              onChange={(e) => update('billDate', e.target.value)}
            />
            <button type="button" className="btn ghost" onClick={addBillDate}>
              Add
            </button>
          </div>
          <div className="chip-row">
            {form.billDates.map((d, i) => (
              <span key={`${d}-${i}`} className="chip">
                {d}
              </span>
            ))}
          </div>
        </label>

        <label>
          Bill Value *
          <div className="inline-row">
            <input
              value={form.billValues}
              onChange={(e) => update('billValues', e.target.value)}
              placeholder="e.g. 1000+250"
            />
            <span className="muted">Total {totalBillValue}</span>
          </div>
        </label>

        <label>
          Cases *
          <div className="inline-row">
            <input
              placeholder="Regular"
              value={form.regularCases}
              onChange={(e) => update('regularCases', e.target.value)}
            />
            <input
              placeholder="Big"
              value={form.bigCases}
              onChange={(e) => update('bigCases', e.target.value)}
            />
            <span className="muted">Total {form.cases || 0}</span>
          </div>
        </label>

        <label>
          Pvt. Marka *
          <input
            style={{ textTransform: 'uppercase' }}
            value={form.marka}
            onChange={(e) => update('marka', e.target.value)}
          />
        </label>

        <label>
          Permit No
          <input value={form.permitNo} onChange={(e) => update('permitNo', e.target.value)} />
        </label>

        <label>
          Commodity
          <select value={form.commodity} onChange={(e) => update('commodity', e.target.value)}>
            <option value="">Select</option>
            {commodities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Company / Division
          <select value={form.companyId} onChange={(e) => update('companyId', e.target.value)}>
            <option value="">Select</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code || c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={!canWrite || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={!canWrite || saving}
            onClick={() => handleSave(true)}
          >
            Save & Print
          </button>
        </div>
      </form>
    </section>
  )
}
