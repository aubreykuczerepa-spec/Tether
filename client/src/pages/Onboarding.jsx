import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Onboarding() {
  const { user, refreshCouple } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [passPhoneMode, setPassPhoneMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getOnboarding()
      if (data.complete) {
        await refreshCouple()
        navigate('/timeline')
        return
      }
      setState(data)
      setAnswer('')
      setPassPhoneMode(false)
    } catch (err) {
      setError('Could not load onboarding. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [navigate, refreshCouple])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // Poll for state changes (handles different-phone scenario)
  useEffect(() => {
    if (!state || state.complete) return
    if (state.isMyTurn) return // no need to poll when it's my turn

    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [state, load])

  async function handleSubmit(isForPartner = false) {
    if (!answer.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const result = await api.submitAnswer(answer.trim(), isForPartner)
      if (result.onboardingComplete) {
        await refreshCouple()
        navigate('/timeline')
      } else {
        await load()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !state) return <div className="spinner" style={{ marginTop: '40vh' }} />

  const progress = ((state.step - 1) * 4 + phaseIndex(state.phase)) / 20
  const isReactionPhase = state.phase === 'p1_react' || state.phase === 'p2_react'

  // Determine whose turn it is by display name
  const actorId = (state.phase === 'p1_answer' || state.phase === 'p1_react') ? state.p1Id : state.p2Id
  const actorName = actorId === state.user.id ? state.user.name : state.partner?.name

  const isMyTurnActually = actorId === state.user.id

  // The answer shown during reaction phases
  const baseAnswerFromOther = state.answers?.find(a =>
    a.answer_type === 'base' && a.user_id !== actorId
  )

  return (
    <div className="onboarding">
      <div className="onboarding__progress">
        <div className="onboarding__progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="onboarding__content">
        <p className="onboarding__step-label">
          Question {state.step} of {state.totalSteps}
        </p>

        <h2 className="onboarding__question">{state.question}</h2>

        {/* Reaction phase: show what the other person wrote */}
        {isReactionPhase && baseAnswerFromOther && (
          <div className="onboarding__prior-answer">
            <p className="onboarding__prior-answer-name">
              {state.answers.find(a => a.user_id === baseAnswerFromOther.user_id)?.users?.name || state.partner?.name} wrote
            </p>
            <p className="onboarding__prior-answer-text">{baseAnswerFromOther.content}</p>
          </div>
        )}

        {/* Pass-phone interstitial */}
        {passPhoneMode ? (
          <div className="onboarding__pass-phone">
            <h2>Pass the phone to<br />{actorName}</h2>
            <p>
              {isReactionPhase
                ? `It's ${actorName}'s turn to respond.`
                : `${actorName} answers this question independently.`}
            </p>
            <button className="btn btn-primary" onClick={() => setPassPhoneMode(false)}>
              I'm {actorName}, I'm ready
            </button>
          </div>
        ) : isMyTurnActually ? (
          /* My turn — show input */
          <>
            <p className="onboarding__whose-turn">
              {isReactionPhase ? `Your response to ${state.partner?.name}` : 'Your answer'}
            </p>
            {error && <div className="error-banner">{error}</div>}
            <div className="field field--large">
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Write honestly. This is yours."
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit(false)}
              disabled={!answer.trim() || submitting}
            >
              {submitting ? 'Saving…' : 'Continue'}
            </button>
          </>
        ) : (
          /* Not my turn on this device */
          <>
            {/* Option A: partner is on same phone */}
            <div className="onboarding__pass-phone">
              <h2>Pass the phone to<br />{actorName}</h2>
              <p>
                {isReactionPhase
                  ? `It's ${actorName}'s turn to respond.`
                  : `${actorName} answers this question independently.`}
              </p>
              <button className="btn btn-primary" onClick={() => setPassPhoneMode(true)}>
                Pass the phone
              </button>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 12 }}>
                On separate phones?
              </p>
              <div className="onboarding__waiting">
                <p>Waiting for {actorName}…</p>
              </div>
            </div>

            {/* Same-phone: submit as partner */}
            <div style={{ marginTop: 24 }}>
              <div className="field field--large" style={{ display: passPhoneMode ? 'block' : 'none' }}>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write honestly. This is yours."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function phaseIndex(phase) {
  return { p1_answer: 0, p2_answer: 1, p1_react: 2, p2_react: 3 }[phase] ?? 0
}
