const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { anthropic } = require('../lib/anthropic')
const { requireAuth } = require('../middleware/auth')

const ONBOARDING_QUESTIONS = [
  "When you imagine opening this app 10 years from now, what is the first thing you hope you see?",
  "Where is the line between what stays yours alone and what gets woven into your shared story?",
  "What does the ritual of coming back to this app look like for you?",
  "What are the small things your partner does that you never want to forget?",
  "What is one thing you hope this app never lets you lose sight of about each other?"
]

async function triggerAIMergeIfReady(coupleId, date) {
  try {
    // Skip if story already exists
    const { data: existing } = await supabase
      .from('combined_stories')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('entry_date', date)
      .single()
    if (existing) return

    // Need both partners' entries for this date
    const { data: entries } = await supabase
      .from('entries')
      .select('*, users(id, name)')
      .eq('couple_id', coupleId)
      .eq('date', date)
      .eq('is_lockbox', false)
      .neq('entry_type', 'little_thing')

    if (!entries || entries.length < 2) return

    // Ensure they're from two different users
    const uniqueUsers = new Set(entries.map(e => e.user_id))
    if (uniqueUsers.size < 2) return

    // Load onboarding answers for tone calibration
    const { data: onboardingAnswers } = await supabase
      .from('onboarding_answers')
      .select('*, users(name)')
      .eq('couple_id', coupleId)
      .order('question_number')
      .order('created_at')

    let onboardingContext = ''
    if (onboardingAnswers && onboardingAnswers.length > 0) {
      onboardingContext = '\n\nHere is context about this couple from their onboarding:\n'
      for (let i = 1; i <= 5; i++) {
        const qAnswers = onboardingAnswers.filter(a => a.question_number === i)
        if (qAnswers.length > 0) {
          onboardingContext += `\n"${ONBOARDING_QUESTIONS[i - 1]}"\n`
          qAnswers.forEach(a => {
            const label = a.answer_type === 'base' ? `${a.users.name}` : `${a.users.name} (responding)`
            onboardingContext += `  ${label}: ${a.content}\n`
          })
        }
      }
    }

    const entry1 = entries[0]
    const entry2 = entries[1]
    const name1 = entry1.users.name
    const name2 = entry2.users.name

    const prompt = `You are the narrator of a couples diary called Tether. Two people — ${name1} and ${name2} — have logged their individual memories of the same experience.${onboardingContext}

Your job is to merge their two perspectives into one combined story that honors both voices equally. Let their onboarding answers — their values, their language, the way they see each other — inform the tone, warmth, and texture of how you write. This story should feel like it could only be theirs.

Two rules above all: never let one partner's voice dominate just because they wrote more, and a short entry is never a lesser entry — read the depth of feeling, not the length of the text.

Do not pick a winner. Do not editorialize. Write in a warm, intimate, literary tone — like something worth reading aloud at a dinner table fifty years from now.

${name1}'s entry:
${entry1.description}

${name2}'s entry:
${entry2.description}

Write the combined story. No preamble. No explanation. Just the story.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const narrative = message.content[0].text

    await supabase.from('combined_stories').insert({
      couple_id: coupleId,
      entry_date: date,
      ai_narrative: narrative,
      entry_one_id: entry1.id,
      entry_two_id: entry2.id
    })
  } catch (err) {
    console.error('AI merge error:', err)
  }
}

// POST /api/entries
router.post('/', requireAuth, async (req, res) => {
  if (!req.couple) return res.status(403).json({ message: 'You must connect with a partner first' })

  const { date, title, location, description, mood, entry_type = 'full', is_lockbox = false } = req.body

  if (!description || !description.trim()) {
    return res.status(400).json({ message: 'Description is required' })
  }
  if (!date) return res.status(400).json({ message: 'Date is required' })

  try {
    const { data: entry, error } = await supabase
      .from('entries')
      .insert({
        user_id: req.user.id,
        couple_id: req.couple.id,
        date,
        title: title || null,
        location: location || null,
        description: description.trim(),
        mood: mood || null,
        entry_type,
        is_lockbox
      })
      .select()
      .single()
    if (error) throw error

    // Fire AI merge in background — don't await, don't block the response
    if (!is_lockbox && entry_type !== 'little_thing') {
      triggerAIMergeIfReady(req.couple.id, date)
    }

    res.json({ entry })
  } catch (err) {
    console.error('Create entry error:', err)
    res.status(400).json({ message: err.message })
  }
})

// GET /api/entries  (timeline)
router.get('/', requireAuth, async (req, res) => {
  if (!req.couple) return res.status(403).json({ message: 'You must connect with a partner first' })

  const partnerId = req.couple.user_one_id === req.user.id
    ? req.couple.user_two_id
    : req.couple.user_one_id

  try {
    const [myEntriesRes, partnerEntriesRes, storiesRes] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('couple_id', req.couple.id)
        .eq('is_lockbox', false)
        .neq('entry_type', 'little_thing')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('entries')
        .select('*')
        .eq('user_id', partnerId)
        .eq('couple_id', req.couple.id)
        .eq('is_lockbox', false)
        .neq('entry_type', 'little_thing')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('combined_stories')
        .select('*')
        .eq('couple_id', req.couple.id)
        .order('entry_date', { ascending: false })
    ])

    const myEntries = myEntriesRes.data || []
    const partnerEntries = partnerEntriesRes.data || []
    const stories = storiesRes.data || []

    // Pending: dates where I've logged but partner hasn't, and no combined story yet
    const partnerDates = new Set(partnerEntries.map(e => e.date))
    const storyDates = new Set(stories.map(s => s.entry_date))

    const pendingDates = myEntries
      .filter(e => !partnerDates.has(e.date) && !storyDates.has(e.date))
      .reduce((acc, e) => {
        if (!acc.find(d => d.date === e.date)) acc.push({ date: e.date })
        return acc
      }, [])

    res.json({ myEntries, partnerEntries, stories, pendingDates })
  } catch (err) {
    console.error('Get entries error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/entries/lockbox
router.get('/lockbox', requireAuth, async (req, res) => {
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_lockbox', true)
    .neq('entry_type', 'little_thing')
    .order('date', { ascending: false })
  res.json({ entries: entries || [] })
})

// GET /api/entries/little-things
router.get('/little-things', requireAuth, async (req, res) => {
  if (!req.couple) return res.status(403).json({ message: 'You must connect with a partner first' })

  const partnerId = req.couple.user_one_id === req.user.id
    ? req.couple.user_two_id
    : req.couple.user_one_id

  const [mineRes, receivedRes] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('couple_id', req.couple.id)
      .eq('entry_type', 'little_thing')
      .order('created_at', { ascending: false }),
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', partnerId)
      .eq('couple_id', req.couple.id)
      .eq('entry_type', 'little_thing')
      .eq('shared_little_thing', true)
      .order('created_at', { ascending: false })
  ])

  res.json({ mine: mineRes.data || [], received: receivedRes.data || [] })
})

// PUT /api/entries/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('entries')
    .select('id, user_id')
    .eq('id', req.params.id)
    .single()

  if (!existing || existing.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' })
  }

  const { title, location, description, mood, is_lockbox } = req.body
  const { data: entry, error } = await supabase
    .from('entries')
    .update({ title, location, description, mood, is_lockbox, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ message: error.message })
  res.json({ entry })
})

// DELETE /api/entries/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('entries')
    .select('id, user_id')
    .eq('id', req.params.id)
    .single()

  if (!existing || existing.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' })
  }

  await supabase.from('entries').delete().eq('id', req.params.id)
  res.json({ success: true })
})

// POST /api/entries/:id/share-little-thing
router.post('/:id/share-little-thing', requireAuth, async (req, res) => {
  const { data: existing } = await supabase
    .from('entries')
    .select('id, user_id, entry_type')
    .eq('id', req.params.id)
    .single()

  if (!existing || existing.user_id !== req.user.id || existing.entry_type !== 'little_thing') {
    return res.status(403).json({ message: 'Not authorized' })
  }

  const { data: entry } = await supabase
    .from('entries')
    .update({ shared_little_thing: true })
    .eq('id', req.params.id)
    .select()
    .single()

  res.json({ entry })
})

module.exports = router
