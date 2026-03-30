import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return setError('All fields are required')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      navigate('/connect')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div>
        <h1 className="auth-page__logo">Tether</h1>
        <p className="auth-page__tagline">Create your account to begin.</p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Your name</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Aubrey"
            autoComplete="given-name"
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-page__switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
