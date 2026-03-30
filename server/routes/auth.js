const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

function generateInviteCode() {
  // Unambiguous characters only (no 0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function uniqueInviteCode() {
  let code, exists = true
  while (exists) {
    code = generateInviteCode()
    const { data } = await supabase.from('users').select('id').eq('invite_code', code).single()
    exists = !!data
  }
  return code
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' })
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) throw authError

    const invite_code = await uniqueInviteCode()

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({ id: authData.user.id, name, email, invite_code })
      .select()
      .single()
    if (profileError) throw profileError

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError

    res.json({ user: profile, session: sessionData.session })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(400).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    res.json({ user: profile, session: data.session })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) return res.status(400).json({ message: 'Refresh token required' })

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token })
    if (error) throw error
    res.json({ session: data.session })
  } catch (err) {
    res.status(401).json({ message: 'Session expired, please log in again' })
  }
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await supabase.auth.admin.signOut(req.token)
  } catch (_) {}
  res.json({ message: 'Logged out' })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  let partner = null
  if (req.couple) {
    const partnerId = req.couple.user_one_id === req.user.id
      ? req.couple.user_two_id
      : req.couple.user_one_id
    const { data } = await supabase
      .from('users')
      .select('id, name, email, invite_code')
      .eq('id', partnerId)
      .single()
    partner = data
  }
  res.json({ user: req.user, couple: req.couple, partner })
})

module.exports = router
