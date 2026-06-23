import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export function getTrades() {
  return api.get('/trades').then(r => r.data)
}

export function getStats() {
  return api.get('/stats').then(r => r.data)
}

export function createTrade(data) {
  return api.post('/trades', data).then(r => r.data)
}

export function updateTrade(id, data) {
  return api.put(`/trades/${id}`, data).then(r => r.data)
}

export function getPrices() {
  return api.get('/prices').then(r => r.data)
}

export function analyzePair(pair) {
  return api.get('/analyze', { params: { pair } }).then(r => r.data)
}
