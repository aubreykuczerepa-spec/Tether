const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

// GET /api/stories
router.get('/', requireAuth, async (req, res) => {
  if (!req.couple) return res.status(403).json({ message: 'You must connect with a partner first' })

  const { data: stories } = await supabase
    .from('combined_stories')
    .select('*')
    .eq('couple_id', req.couple.id)
    .order('entry_date', { ascending: false })

  res.json({ stories: stories || [] })
})

module.exports = router
