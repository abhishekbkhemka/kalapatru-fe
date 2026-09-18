import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../api/client'
import {
  getForwardingNote,
  getLorryReceipts,
  saveLorryReceipt,
} from '../api/kalapatru'
import { formatDisplayDate } from '../utils/dates'

function notifyStatusLabel(notifications = []) {
  if (!notifications.length) return 'No send'
  if (notifications.every((n) => n.status === 'sent')) return 'Sent'
  if (notifications.some((n) => n.status === 'sent')) return 'Partial'
  return 'Failed'
}

export default function AttachLR({ magicUser = null }) {
  const auth = useAuth()
  const canWrite = magicUser ? true : auth.canWrite
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const [fnId, setFnId] = useState('')
  const [note, setNote] = useState(null)
  const [history, setHistory] = useState([])
  const [lrNumber, setLrNumber] = useState('')
  const [notifyRequested, setNotifyRequested] = useState(false)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [notifyResult, setNotifyResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  function addFiles(fileList) {
    const next = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!next.length) return
    setFiles((prev) => [...prev, ...next])
    setPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))])
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const copy = [...prev]
      const [removed] = copy.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed)
      return copy
    })
  }

  async function loadHistory(id) {
    const rows = await getLorryReceipts(id)
    setHistory(rows || [])
  }

  async function lookupFn(e) {
    e?.preventDefault()
    const id = String(fnId).trim()
    if (!id) {
      setError('Enter a Forwarding Number Id')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    setNotifyResult('')
    setNote(null)
    setHistory([])
    setFiles([])
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return []
    })
    try {
      const data = await getForwardingNote(id)
      setNote(data)
      setNotifyRequested(Boolean(data?.customer?.notifyWhatsApp))
      setLrNumber('')
      await loadHistory(data.id)
    } catch (err) {
      setError(getErrorMessage(err, 'Forwarding note not found'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!note) {
      setError('Lookup a forwarding note first')
      return
    }
    if (!files.length) {
      setError('Add at least one LR photo')
      return
    }
    if (notifyRequested) {
      const nums = [
        note.customer?.whatsappNumber1,
        note.customer?.whatsappNumber2,
      ].filter(Boolean)
      if (!note.customer) {
        setError('This FN has no customer; turn off WhatsApp notify or assign a customer')
        return
      }
      if (!nums.length) {
        setError('Customer has no WhatsApp numbers. Ask admin to add them, or uncheck notify.')
        return
      }
    }

    setSaving(true)
    setError('')
    setMessage('')
    setNotifyResult('')
    try {
      const result = await saveLorryReceipt({
        forwardingNoteId: note.id,
        lrNumber,
        notifyRequested,
        images: files,
      })
      setMessage(`LR #${result.lorryReceipt?.id} saved`)
      const notifs = result.notifications || []
      if (!notifyRequested) {
        setNotifyResult('WhatsApp not requested')
      } else if (!notifs.length) {
        setNotifyResult('No notification attempts recorded')
      } else {
        const lines = notifs.map((n) => {
          const to = n.toNumber || '(no number)'
          if (n.status === 'sent') return `${to}: sent`
          return `${to}: ${n.errorMessage || n.status || 'failed'}`
        })
        setNotifyResult(lines.join(' · '))
      }
      setFiles([])
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url))
        return []
      })
      setLrNumber('')
      await loadHistory(note.id)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save LR'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel attach-lr">
      <h2 className="page-title">Attach LR</h2>
      <p className="muted">Look up a forwarding note, photograph the LR, optionally notify on WhatsApp.</p>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      {notifyResult && <div className="alert info">{notifyResult}</div>}

      <form className="classic-form attach-lr-lookup" onSubmit={lookupFn}>
        <label>
          Forwarding Number Id
          <div className="inline-row">
            <input
              inputMode="numeric"
              value={fnId}
              onChange={(e) => setFnId(e.target.value)}
              placeholder="e.g. 12345"
              autoComplete="off"
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Loading…' : 'Fetch'}
            </button>
          </div>
        </label>
      </form>

      {note && (
        <>
          <div className="fn-summary">
            <div><strong>FN</strong> {note.id}</div>
            <div><strong>Customer</strong> {note.customer?.name || '—'} {note.customer?.city ? `(${note.customer.city})` : ''}</div>
            <div><strong>Transporter</strong> {note.transporter?.name || '—'}</div>
            <div><strong>Station</strong> {note.transporterStation || '—'}</div>
            <div><strong>Cases</strong> {note.cases || '—'} · <strong>Marka</strong> {note.marka || '—'}</div>
            <div><strong>Dispatched</strong> {note.isDispatched ? 'Yes' : 'No'}</div>
            <div>
              <strong>WhatsApp numbers</strong>{' '}
              {[note.customer?.whatsappNumber1, note.customer?.whatsappNumber2].filter(Boolean).join(', ') || 'None configured'}
            </div>
          </div>

          {canWrite ? (
            <form className="classic-form attach-lr-form" onSubmit={handleSave}>
              <label>
                Transporter LR number {notifyRequested ? '*' : '(optional)'}
                <input
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="Type LR no. from transporter paper"
                  required={notifyRequested}
                />
              </label>
              <p className="muted small">
                Not auto-fetched — enter the number printed on the transporter LR.
                Required when WhatsApp notify is checked.
              </p>

              <div className="photo-actions">
                <button type="button" className="btn" onClick={() => cameraRef.current?.click()}>
                  Take photo
                </button>
                <button type="button" className="btn secondary" onClick={() => galleryRef.current?.click()}>
                  Upload from gallery
                </button>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>

              {previews.length > 0 && (
                <div className="photo-grid">
                  {previews.map((url, idx) => (
                    <div className="photo-thumb" key={url}>
                      <img src={url} alt={`LR ${idx + 1}`} />
                      <button type="button" className="link-btn" onClick={() => removeFile(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={notifyRequested}
                  onChange={(e) => setNotifyRequested(e.target.checked)}
                />
                Send WhatsApp notification
              </label>
              <p className="muted small">
                Pre-filled from customer setting. Uncheck to save LR without notifying.
                Uses Interakt when `WHATSAPP_PROVIDER=interakt` is configured on the API.
              </p>

              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save LR'}
              </button>
            </form>
          ) : (
            <div className="alert info">View-only role — you can browse existing LRs below.</div>
          )}

          <div className="lr-history">
            <h3>All LRs for FN {note.id}</h3>
            {!history.length && <p className="muted">No LR records yet.</p>}
            <ul className="lr-history-list">
              {history.map((lr) => (
                <li key={lr.id} className="lr-history-item">
                  <div className="lr-history-meta">
                    <strong>LR #{lr.id}</strong>
                    {lr.lrNumber ? ` · ${lr.lrNumber}` : ''}
                    <span> · {formatDisplayDate(lr.createdAt) || lr.createdAt}</span>
                    <span> · Notify: {lr.notifyRequested ? 'Yes' : 'No'}</span>
                    <span> · {notifyStatusLabel(lr.notifications)}</span>
                    {lr.createdByName ? <span> · {lr.createdByName}</span> : null}
                  </div>
                  <div className="photo-grid compact">
                    {(lr.images || []).map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="photo-thumb">
                        <img src={img.url} alt={`LR ${lr.id}`} />
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
