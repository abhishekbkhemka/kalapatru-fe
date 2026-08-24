import { useEffect, useState } from 'react'
import { createUser, deactivateUser, listUsers, updateUser } from '../api/auth'
import { getErrorMessage } from '../api/client'

const emptyForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'operator',
  is_active: true,
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setUsers(await listUsers())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
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
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

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
    </section>
  )
}
