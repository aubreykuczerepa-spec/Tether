import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import Layout from '../components/Layout'

const MOODS = ['Happy', 'Romantic', 'Peaceful', 'Excited', 'Nostalgic', 'Grateful', 'Adventurous', 'Cozy', 'Bittersweet', 'Silly']

function today() {
  return new Date().toISOString().split('T')[0]
}

const ENTRY_TYPES = [
  { value: 'full',       label: 'Full entry',  hint: 'A proper log of an experience.' },
  { value: 'quick_memo', label: 'Quick memo',  hint: 'Drop a pin on a feeling, fast.' },
]

export default function NewEntry() {
  const navigate = useNavigate()
  const location = useLocation()
  const editing = location.state?.editing || null
  const defaultDate = location.state?.defaultDate || today()

  const [entryType, setEntryType] = useState(editing?.entry_type || 'full')
  const [form, setForm] = useState({
    date:        editing?.date        || defaultDate,
    title:       editing?.title       || '',
    location:    editing?.location    || '',
    description: editing?.description || '',
    mood:        editing?.mood        || '',
    is_lockbox:  editing?.is_lockbox  || false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function toggleMood(mood) {
    setForm(f => ({ ...f, mood: f.mood === mood ? '' : mood }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.description.trim()) return setError('Write something — even just a line.')
    if (!form.date) return setError('Date is required.')

    setSubmitting(true)
    try {
      if (editing) {
        await api.updateEntry(editing.id, { ...form, entry_type: entryType })
      } else {
        await api.createEntry({ ...form, entry_type: entryType })
      }
      navigate('/timeline')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isQuickMemo = entryType === 'quick_memo'

  return (
    <Layout title={editing ? 'Edit entry' : 'New entry'} showBack onBack={() => navigate(-1)}>
      <div style={{ paddingTop: 8, paddingBottom: 40 }}>
        {!editing && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {ENTRY_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`mood-pill${entryType === t.value ? ' selected' : ''}`}
                onClick={() => setEntryType(t.value)}
                style={{ flex: 1, padding: '10px 8px', textAlign: 'center' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label>Date of experience</label>
            <input type="date" value={form.date} onChange={set('date')} max={today()} />
          </div>

          {!isQuickMemo && (
            <>
              <div className="field">
                <label>Title <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="A name for this memory"
                />
              </div>

              <div className="field">
                <label>Location <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="Where were you?"
                />
              </div>
            </>
          )}

          <div className="field field--large">
            <label>{isQuickMemo ? 'What's on your mind?' : 'Your entry'}</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder={isQuickMemo
                ? 'Drop a thought, a feeling, a moment…'
                : 'Tell it in your own voice. The honest version.'}
              autoFocus
            />
          </div>

          {!isQuickMemo && (
            <div className="field">
              <label>Mood <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <div className="mood-picker">
                {MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`mood-pill${form.mood === m ? ' selected' : ''}`}
                    onClick={() => toggleMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="toggle-row">
            <div className="toggle-row__info">
              <p className="toggle-row__label">Lockbox</p>
              <p className="toggle-row__hint">Only you will ever see this. It will never reach your partner or the AI.</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.is_lockbox}
                onChange={e => setForm(f => ({ ...f, is_lockbox: e.target.checked }))}
              />
              <span className="toggle__track" />
            </label>
          </div>

          <div style={{ marginTop: 28 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? (editing ? 'Saving…' : 'Logging…')
                : (editing ? 'Save changes' : 'Log entry')}
            </button>
          </div>

          {editing && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginTop: 12, display: 'block', textAlign: 'center', width: '100%' }}
              onClick={async () => {
                if (!confirm('Delete this entry? This cannot be undone.')) return
                try {
                  await api.deleteEntry(editing.id)
                  navigate('/timeline')
                } catch (err) {
                  setError(err.message)
                }
              }}
            >
              Delete entry
            </button>
          )}
        </form>
      </div>
    </Layout>
  )
}
