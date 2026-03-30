const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

const QUESTIONS = [
  "When you imagine opening this app 10 years from now, what is the first thing you hope you see — and what emotion do you want it to hit you with?",
  "Where is the line between what stays yours alone and what gets woven into your shared story?",
  "What does the ritual of coming back to this app look like for you — and what would make it feel meaningful instead of like homework?",
  "What are the small things your partner does that you never want to forget but might never say out loud?",
  "What is one thing you hope this app never lets you lose sight of about each other?"
]

// Who answers first alternates by question number
// Odd questions (1,3,5): user_one first | Even questions (2,4): user_two first
function getP1(step, couple) {
  return step % 2 === 1 ? couple.user_one_id : couple.user_two_id
}
function getP2(step, couple) {
  return step % 2 === 1 ? couple.user_two_id : couple.user_one_id
}

// GET /api/onboarding
router.get('/', requireAuth, async (req, res) => {
  if (!req.couple) return res.status(400).json({ message: 'No couple found' })

  if (req.couple.onboarding_complete) {
    return res.json({ complete: true })
  }

  const couple = req.couple
  const step = couple.onboarding_step
  const phase = couple.onboarding_phase
  const p1Id = getP1(step, couple)
  const p2Id = getP2(step, couple)

  const isMyTurn =
    (phase === 'p1_answer' && req.user.id === p1Id) ||
    (phase === 'p2_answer' && req.user.id === p2Id) ||
    (phase === 'p1_react' && req.user.id === p1Id) ||
    (phase === 'p2_react' && req.user.id === p2Id)

  const { data: answers } = await supabase
    .from('onboarding_answers')
    .select('*, users(id, name)')
    .eq('couple_id', couple.id)
    .eq('question_number', step)
    .order('created_at')

  const partnerId = req.user.id === couple.user_one_id ? couple.user_two_id : couple.user_one_id
  const { data: partner } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', partnerId)
    .single()

  res.json({
    complete: false,
    step,
    totalSteps: 5,
    phase,
    question: QUESTIONS[step - 1],
    isMyTurn,
    p1Id,
    p2Id,
    answers: answers || [],
    partner,
    user: { id: req.user.id, name: req.user.name }
  })
})

// POST /api/onboarding/answer
router.post('/answer', requireAuth, async (req, res) => {
  const { content, forPartner = false } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Answer is required' })
  }
  if (!req.couple) return res.status(400).json({ message: 'No couple found' })

  const couple = req.couple
  if (couple.onboarding_complete) {
    return res.status(400).json({ message: 'Onboarding is already complete' })
  }

  const step = couple.onboarding_step
  const phase = couple.onboarding_phase
  const p1Id = getP1(step, couple)
  const p2Id = getP2(step, couple)

  // For same-phone: attribute answer to partner instead of current session user
  let authorId = req.user.id
  if (forPartner) {
    authorId = req.user.id === couple.user_one_id ? couple.user_two_id : couple.user_one_id
  }

  const expectedAuthor = (phase === 'p1_answer' || phase === 'p1_react') ? p1Id : p2Id
  if (authorId !== expectedAuthor) {
    return res.status(403).json({ message: "It's not your turn" })
  }

  const answerType = (phase === 'p1_answer' || phase === 'p2_answer') ? 'base' : 'reaction'

  try {
    await supabase.from('onboarding_answers').insert({
      couple_id: couple.id,
      user_id: authorId,
      question_number: step,
      answer_type: answerType,
      content: content.trim()
    })

    // Advance state
    let nextPhase = phase
    let nextStep = step
    let onboardingComplete = false

    if (phase === 'p1_answer') nextPhase = 'p2_answer'
    else if (phase === 'p2_answer') nextPhase = 'p1_react'
    else if (phase === 'p1_react') nextPhase = 'p2_react'
    else if (phase === 'p2_react') {
      if (step < 5) {
        nextStep = step + 1
        nextPhase = 'p1_answer'
      } else {
        onboardingComplete = true
      }
    }

    await supabase.from('couples').update({
      onboarding_step: nextStep,
      onboarding_phase: nextPhase,
      onboarding_complete: onboardingComplete
    }).eq('id', couple.id)

    res.json({ success: true, nextPhase, nextStep, onboardingComplete })
  } catch (err) {
    console.error('Onboarding answer error:', err)
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
