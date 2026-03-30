const BASE = '/api'

function getToken() {
  return localStorage.getItem('tether_token')
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed (${res.status})`)
  }

  return res.json()
}

export const api = {
  // Auth
  signup:  (data)  => request('POST', '/auth/signup', data),
  login:   (data)  => request('POST', '/auth/login', data),
  logout:  ()      => request('POST', '/auth/logout'),
  refresh: (token) => request('POST', '/auth/refresh', { refresh_token: token }),
  me:      ()      => request('GET',  '/auth/me'),

  // Couple
  getCouple:  ()     => request('GET',  '/couple'),
  joinCouple: (code) => request('POST', '/couple/join', { invite_code: code }),

  // Onboarding
  getOnboarding:  ()                         => request('GET',  '/onboarding'),
  submitAnswer:   (content, forPartner=false) => request('POST', '/onboarding/answer', { content, forPartner }),

  // Entries
  getEntries:    ()       => request('GET',    '/entries'),
  getLockbox:    ()       => request('GET',    '/entries/lockbox'),
  getLittleThings: ()     => request('GET',    '/entries/little-things'),
  createEntry:   (data)   => request('POST',   '/entries', data),
  updateEntry:   (id, d)  => request('PUT',    `/entries/${id}`, d),
  deleteEntry:   (id)     => request('DELETE', `/entries/${id}`),
  shareLittleThing: (id)  => request('POST',   `/entries/${id}/share-little-thing`),

  // Stories
  getStories: () => request('GET', '/stories'),
}
