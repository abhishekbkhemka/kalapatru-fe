import { useEffect, useState } from 'react'
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
  listLrUploadTokens,
  createLrUploadToken,
  revokeLrUploadToken,
} from '../api/auth'
import { getErrorMessage } from '../api/client'
import { formatDisplayDate } from '../utils/dates'

const emptyForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'operator',
  is_active: true,
}

function magicLinkUrl(token) {
  const origin = window.location.origin
  return `${origin}/lr-upload?token=${encodeURIComponent(token)}`
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [linkUserId, setLinkUserId] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [tokens, setTokens] = useState([])
  const [linkBusy, setLinkBusy] = useState(false)

  async function load() {
    try {
      setUsers(await listUsers())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function loadTokens() {
    try {
      setTokens(await listLrUploadTokens())
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load upload links'))
    }
  }

  useEffect(() => {
    load()
    loadTokens()
  }, [])

  function startEdit(user) {
    setEditingId(user.id)
    setForm({
      username: user.username,
      password: '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'viewer',
      is_active: user.is_active,
    })
    setMessage('')
    setError('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editingId) {
        await updateUser(editingId, payload)
        setMessage('User updated')
      } else {
        if (!payload.password) {
          setError('Password is required for new users')
          setSaving(false)
          return
        }
        await createUser(payload)
        setMessage('User created')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save user'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate this user?')) return
    try {
      await deactivateUser(id)
      setMessage('User deactivated')
      await load()
      await loadTokens()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleCreateLink(e) {
    e.preventDefault()
    if (!linkUserId) {
      setError('Select a user for the upload link')
      return
    }
    setLinkBusy(true)
    setError('')
    setMessage('')
    try {
      const row = await createLrUploadToken({
        userId: Number(linkUserId),
        label: linkLabel,
        revokeOthers: true,
      })
      setMessage('Upload link created (previous active link for this user was revoked)')
      setLinkLabel('')
      await loadTokens()
      const url = magicLinkUrl(row.token)
      try {
        await navigator.clipboard.writeText(url)
        setMessage((m) => `${m}. Link copied to clipboard.`)
      } catch {
        // ignore clipboard failures
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create link'))
    } finally {
      setLinkBusy(false)
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm('Revoke this upload link? It will stop working immediately.')) return
    try {
      await revokeLrUploadToken(id)
      setMessage('Upload link revoked')
      await loadTokens()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function copyLink(token) {
    const url = magicLinkUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied')
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const linkUsers = users.filter(
    (u) => u.is_active && (u.role === 'operator' || u.role === 'admin'),
  )

  return (
    <section className="panel">
      <h2 className="page-title">User Management</h2>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Username *
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
          />
        </label>
        <label>
          Password {editingId ? '(leave blank to keep)' : '*'}
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editingId}
          />
        </label>
        <label>
          First name
          <input
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
        </label>
        <label>
          Last name
          <input
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label>
          Role *
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active
        </label>
        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update user' : 'Create user'}
          </button>
          {editingId && (
            <button type="button" className="btn ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>
                {u.first_name} {u.last_name}
              </td>
              <td>
                <span className="role-pill">{u.role}</span>
              </td>
              <td>{u.is_active ? 'Active' : 'Inactive'}</td>
              <td className="row-actions">
                <button type="button" className="link-btn" onClick={() => startEdit(u)}>
                  Edit
                </button>
                {u.is_active && (
                  <button
                    type="button"
                    className="link-btn danger"
                    onClick={() => handleDeactivate(u.id)}
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="magic-links-section">
        <h3>Attach LR magic links</h3>
        <p className="muted">
          Never expire until revoked. Create an <strong>operator</strong> user for each driver,
          then generate a link. LR saves are recorded under that user.
        </p>
        <form className="form-grid compact" onSubmit={handleCreateLink}>
          <label>
            User *
            <select
              value={linkUserId}
              onChange={(e) => setLinkUserId(e.target.value)}
              required
            >
              <option value="">Select operator…</option>
              {linkUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                  {u.first_name ? ` (${u.first_name})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Label (optional)
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="e.g. Driver Ramesh phone"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={linkBusy}>
              {linkBusy ? 'Creating…' : 'Create / rotate link'}
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Label</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id}>
                  <td>{t.username}</td>
                  <td>{t.label || '—'}</td>
                  <td>{t.is_active ? 'Active' : 'Revoked'}</td>
                  <td>{formatDisplayDate(t.created_at) || t.created_at}</td>
                  <td>{t.last_used_at ? formatDisplayDate(t.last_used_at) : 'Never'}</td>
                  <td className="row-actions">
                    {t.is_active && (
                      <>
                        <button type="button" className="link-btn" onClick={() => copyLink(t.token)}>
                          Copy link
                        </button>
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => handleRevoke(t.id)}
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {!tokens.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No upload links yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
