import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      return setError('Email and password are required')
    }
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      navigate('/')
    } catch (err) {
      setError('Wrong email or password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div>
        <h1 className="auth-page__logo">Tether</h1>
        <p className="auth-page__tagline">Welcome back.</p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

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
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-page__switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  )
}
