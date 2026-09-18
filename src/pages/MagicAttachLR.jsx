import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveLrUploadToken } from '../api/auth'
import { getErrorMessage, setUploadToken, clearUploadToken } from '../api/client'
import AttachLR from './AttachLR'

export default function MagicAttachLR() {
  const [params] = useSearchParams()
  const tokenFromUrl = (params.get('token') || '').trim()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!tokenFromUrl) {
        setError('This upload link is missing a token.')
        setLoading(false)
        return
      }
      clearUploadToken()
      try {
        const data = await resolveLrUploadToken(tokenFromUrl)
        if (cancelled) return
        setUploadToken(data.token)
        setUser(data.user)
        setError('')
      } catch (err) {
        if (cancelled) return
        clearUploadToken()
        setUser(null)
        setError(getErrorMessage(err, 'Invalid or revoked upload link'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [tokenFromUrl])

  if (loading) {
    return (
      <div className="magic-lr-shell">
        <div className="panel">Checking upload link…</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="magic-lr-shell">
        <div className="panel">
          <h2 className="page-title">Attach LR</h2>
          <div className="alert error">{error || 'Link not valid'}</div>
          <p className="muted">Ask your admin for a new upload link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="magic-lr-shell">
      <header className="magic-lr-header">
        <strong>Kalapatru · Attach LR</strong>
        <span>
          Signed in as {user.first_name || user.username}
        </span>
      </header>
      <main className="app-main">
        <AttachLR magicUser={user} />
      </main>
    </div>
  )
}
