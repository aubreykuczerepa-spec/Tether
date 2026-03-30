import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import Layout from '../components/Layout'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Lockbox() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.getLockbox()
      .then(res => setEntries(res.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Lockbox"><div className="spinner" /></Layout>

  return (
    <Layout title="Lockbox">
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
        These entries are yours alone. They will never reach your partner or the AI.
      </p>

      {!entries.length ? (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>Your lockbox is a private space for thoughts that aren't ready to be shared — or may never need to be.</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/new-entry')}
          >
            Add an entry
          </button>
        </div>
      ) : (
        entries.map(entry => (
          <div
            key={entry.id}
            className="card"
            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            style={{ cursor: 'pointer' }}
          >
            <p className="card__meta">Lockbox</p>
            <p className="card__date">{formatDate(entry.date)}</p>
            {entry.title && (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', marginBottom: 8, color: 'var(--ink)' }}>
                {entry.title}
              </p>
            )}
            <p className={`card__body${expanded === entry.id ? '' : ' card__body--truncate'}`}>
              {entry.description}
            </p>
            {entry.mood && <span className="card__mood">{entry.mood}</span>}
            {expanded === entry.id && (
              <div className="card__footer">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); navigate('/new-entry', { state: { editing: entry } }) }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </Layout>
  )
}
