import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client'
import { formatDisplayDate } from '../utils/dates'

export default function LrView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: row } = await api.get(`/api/lorry-receipt/public/${token}/`)
        if (!cancelled) setData(row)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'LR not found'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (token) load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="magic-lr-shell">
        <div className="panel">Loading LR…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="magic-lr-shell">
        <div className="panel">
          <h2 className="page-title">LR</h2>
          <div className="alert error">{error || 'Not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="magic-lr-shell">
      <header className="magic-lr-header">
        <strong>Kalapatru · LR</strong>
        <span>FN {data.forwardingNoteId}</span>
      </header>
      <main className="app-main">
        <section className="panel">
          <h2 className="page-title">Lorry Receipt</h2>
          <div className="fn-summary">
            <div><strong>LR No</strong> {data.lrNumber || '—'}</div>
            <div><strong>FN</strong> {data.forwardingNoteId}</div>
            <div><strong>Customer</strong> {data.customerName || '—'}</div>
            <div><strong>Transporter</strong> {data.transporterName || '—'}</div>
            <div><strong>Cases</strong> {data.cases || '—'} · <strong>Marka</strong> {data.marka || '—'}</div>
            <div><strong>Saved</strong> {formatDisplayDate(data.createdAt) || data.createdAt}</div>
          </div>
          <div className="photo-grid">
            {(data.images || []).map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="photo-thumb">
                <img src={img.url} alt={`LR ${data.id}`} />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
