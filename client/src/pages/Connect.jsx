import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Connect() {
  const { user, refreshCouple } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(!user?.invite_code)

  useEffect(() => {
    if (!user?.invite_code) {
      refreshCouple().finally(() => setLoadingProfile(false))
    }
  }, [])

  async function copyCode() {
    await navigator.clipboard.writeText(user.invite_code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    if (code.trim().length < 4) return setError("Please enter your partner's invite code")

    setLoading(true)
    try {
      await api.joinCouple(code.trim())
      await refreshCouple()
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return <div className="spinner" style={{ marginTop: '40vh' }} />
  }

  return (
    <div className="auth-page">
      <div>
        <h1 className="auth-page__logo">Tether</h1>
        <p className="auth-page__tagline">
          Connect with your partner to begin your shared story.
        </p>
      </div>

      <div>
        <p className="section-heading">Your invite code</p>
        <div className="invite-code-display">
          <p className="invite-code-display__label">Share this with your partner</p>
          {user?.invite_code
            ? <p className="invite-code-display__code">{user.invite_code}</p>
            : <p className="invite-code-display__label" style={{ color: 'var(--error, #c0392b)' }}>Could not load code — try refreshing</p>
          }
        </div>
        <button className="btn btn-ghost" onClick={copyCode} style={{ marginBottom: 32 }}>
          {copied ? '✓ Copied' : 'Copy code'}
        </button>

        <div className="divider" />

        <p className="section-heading" style={{ marginTop: 24 }}>Enter their code</p>
        <form onSubmit={handleJoin}>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Partner's invite code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              style={{ letterSpacing: '0.15em', fontSize: '1.1rem', textTransform: 'uppercase' }}
              autoCapitalize="characters"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}
