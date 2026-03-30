const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

// GET /api/couple
router.get('/', requireAuth, async (req, res) => {
  if (!req.couple) return res.json({ couple: null, partner: null })

  const partnerId = req.couple.user_one_id === req.user.id
    ? req.couple.user_two_id
    : req.couple.user_one_id

  const { data: partner } = await supabase
    .from('users')
    .select('id, name, email, invite_code')
    .eq('id', partnerId)
    .single()

  res.json({ couple: req.couple, partner })
})

// POST /api/couple/join
router.post('/join', requireAuth, async (req, res) => {
  const { invite_code } = req.body
  if (!invite_code) return res.status(400).json({ message: 'Invite code is required' })
  if (req.couple) return res.status(400).json({ message: 'You are already connected to a partner' })

  try {
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .single()

    if (partnerError || !partner) {
      return res.status(404).json({ message: 'No account found with that code. Double-check and try again.' })
    }

    if (partner.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot connect with yourself' })
    }

    if (partner.partner_id) {
      return res.status(400).json({ message: 'That person is already connected to a partner' })
    }

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({ user_one_id: req.user.id, user_two_id: partner.id })
      .select()
      .single()
    if (coupleError) throw coupleError

    await supabase.from('users').update({ partner_id: partner.id }).eq('id', req.user.id)
    await supabase.from('users').update({ partner_id: req.user.id }).eq('id', partner.id)

    res.json({
      couple,
      partner: { id: partner.id, name: partner.name, email: partner.email }
    })
  } catch (err) {
    console.error('Join couple error:', err)
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
