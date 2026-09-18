import { api } from './client'
import { toServerDate } from '../utils/dates'

export async function getTransporters() {
  const { data } = await api.get('/api/transporters/')
  return data
}

export async function getCustomers() {
  const { data } = await api.get('/api/customers/')
  return data
}

export async function getSettings() {
  const { data } = await api.get('/api/settings/')
  return data
}

export async function addForwardingNote(payload) {
  const { data } = await api.post('/api/forwardingNote/', payload)
  return data
}

export async function getForwardingNotes({ fromDate, toDate, transporterName = '' } = {}) {
  const params = { transporterName }
  if (fromDate) params.fromDate = toServerDate(fromDate)
  if (toDate) params.toDate = toServerDate(toDate)
  const { data } = await api.get('/api/forwardingNotes/', { params })
  return data
}

export async function getForwardingNote(id) {
  const { data } = await api.get('/api/forwardingNote/', { params: { id } })
  return data
}

export async function getDispatch(id) {
  const { data } = await api.get('/api/dispatch/', { params: { id } })
  return data
}

export async function getVans() {
  const { data } = await api.get('/api/vans/')
  return data
}

export async function saveDispatch(payload, id) {
  if (id) {
    const { data } = await api.put('/api/dispatch/', { ...payload, id })
    return data
  }
  const { data } = await api.post('/api/dispatch/', payload)
  return data
}

export async function getDispatches(fromDate, toDate) {
  const params = { fromDate: toServerDate(fromDate) }
  if (toDate) params.toDate = toServerDate(toDate)
  const { data } = await api.get('/api/dispatches/', { params })
  return data
}

export async function getCustomer(id) {
  const { data } = await api.get(`/api/customers/${id}/`)
  return data
}

export async function updateCustomerNotify(id, payload) {
  const { data } = await api.put(`/api/customers/${id}/`, payload)
  return data
}

export async function getLorryReceipts(forwardingNoteId) {
  const { data } = await api.get('/api/lorry-receipt/', {
    params: { forwardingNoteId },
  })
  return data
}

export async function saveLorryReceipt({
  forwardingNoteId,
  lrNumber,
  notifyRequested,
  images,
}) {
  const form = new FormData()
  form.append('forwardingNoteId', String(forwardingNoteId))
  if (lrNumber) form.append('lrNumber', lrNumber)
  form.append('notifyRequested', notifyRequested ? 'true' : 'false')
  for (const file of images) {
    form.append('images', file)
  }
  const { data } = await api.post('/api/lorry-receipt/', form, {
    headers: { 'Content-Type': undefined },
  })
  return data
}

export async function getNotificationLedger({ customerId, fromDate, toDate, status } = {}) {
  const params = {}
  if (customerId) params.customerId = customerId
  if (fromDate) params.from = toServerDate(fromDate)
  if (toDate) params.to = toServerDate(toDate)
  if (status) params.status = status
  const { data } = await api.get('/api/notification-ledger/', { params })
  return data
}
