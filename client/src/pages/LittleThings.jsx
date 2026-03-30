import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/Layout'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function LittleThings() {
  const { partner } = useAuth()
  const [mine, setMine] = useState([])
  const [received, setReceived] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState(0) // 0 = mine, 1 = received
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await api.getLittleThings()
      setMine(res.mine || [])
      setReceived(res.received || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleLog(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await api.createEntry({
        date: today(),
        description: text.trim(),
        entry_type: 'little_thing',
        is_lockbox: false,
      })
      setText('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleShare(id) {
    try {
      await api.shareLittleThing(id)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <Layout title="Little Things"><div className="spinner" /></Layout>

  return (
    <Layout title="Little Things">
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
        The small moments that usually go unsaid. Log them privately, share them when it feels right.
      </p>

      {showForm ? (
        <form onSubmit={handleLog} style={{ marginBottom: 28 }}>
          {error && <div className="error-banner">{error}</div>}
          <div className="field field--large">
            <label>What did {partner?.name || 'your partner'} do?</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="The way they did that thing…"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save it'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setText('') }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-secondary" style={{ marginBottom: 24 }} onClick={() => setShowForm(true)}>
          + Log a little thing
        </button>
      )}

      <div className="tabs" style={{ position: 'relative', top: 0 }}>
        <button className={`tab${tab === 0 ? ' active' : ''}`} onClick={() => setTab(0)}>Yours</button>
        <button className={`tab${tab === 1 ? ' active' : ''}`} onClick={() => setTab(1)}>
          From {partner?.name || 'them'}
        </button>
      </div>

      {tab === 0 && (
        mine.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing logged yet</h3>
            <p>Notice something that made you feel loved? Capture it here before it fades.</p>
          </div>
        ) : (
          mine.map(entry => (
            <div key={entry.id} className={`little-thing-card${entry.shared_little_thing ? ' little-thing-card--shared' : ''}`}>
              <p className="little-thing-card__date">{formatDate(entry.date)}</p>
              <p className="little-thing-card__text">{entry.description}</p>
              {!entry.shared_little_thing && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10, color: 'var(--gold)' }}
                  onClick={() => handleShare(entry.id)}
                >
                  Share with {partner?.name || 'your partner'}
                </button>
              )}
              {entry.shared_little_thing && (
                <p style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Shared ✓
                </p>
              )}
            </div>
          ))
        )
      )}

      {tab === 1 && (
        received.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing yet</h3>
            <p>When {partner?.name || 'your partner'} shares a little thing with you, it will appear here.</p>
          </div>
        ) : (
          received.map(entry => (
            <div key={entry.id} className="little-thing-card little-thing-card--shared">
              <p className="little-thing-card__date">{formatDate(entry.date)}</p>
              <p className="little-thing-card__text">{entry.description}</p>
            </div>
          ))
        )
      )}
    </Layout>
  )
}
