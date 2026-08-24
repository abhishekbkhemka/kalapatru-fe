import { api } from './client'

export async function login(username, password) {
  const { data } = await api.post('/api/auth/login/', { username, password })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me/')
  return data
}

export async function listUsers() {
  const { data } = await api.get('/api/auth/users/')
  return data
}

export async function createUser(payload) {
  const { data } = await api.post('/api/auth/users/', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/api/auth/users/${id}/`, payload)
  return data
}

export async function deactivateUser(id) {
  await api.delete(`/api/auth/users/${id}/`)
}
