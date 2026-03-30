import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import CombinedStoryCard from '../components/CombinedStoryCard'
import PendingCard from '../components/PendingCard'

const TABS = ['Mine', 'Theirs', 'Combined']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Timeline() {
  const { user, partner } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api.getEntries()
      setData(res)
    } catch (err) {
      setError('Could not load timeline.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteEntry(id)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <Layout><div className="spinner" /></Layout>
  if (error) return <Layout><div className="error-banner">{error}</div></Layout>

  const { myEntries = [], partnerEntries = [], stories = [], pendingDates = [] } = data || {}

  function renderMine() {
    if (!myEntries.length) {
      return (
        <div className="empty-state">
          <h3>Your story starts here</h3>
          <p>Log your first entry and begin building your shared time capsule.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-entry')}>
            Add first entry
          </button>
        </div>
      )
    }
    return myEntries.map(entry => (
      <EntryCard
        key={entry.id}
        entry={entry}
        label="Your entry"
        onDelete={() => handleDelete(entry.id)}
        onEdit={() => navigate('/new-entry', { state: { editing: entry } })}
      />
    ))
  }

  function renderTheirs() {
    // Show partner entries + soft indicators for dates where you've logged but they haven't
    const items = []

    // Pending indicators (only you've logged, waiting for partner)
    pendingDates.forEach(pd => {
      items.push({ type: 'pending', date: pd.date, sortDate: pd.date })
    })

    // Partner entries
    partnerEntries.forEach(entry => {
      items.push({ type: 'entry', entry, sortDate: entry.date })
    })

    items.sort((a, b) => b.sortDate.localeCompare(a.sortDate))

    if (!items.length) {
      return (
        <div className="empty-state">
          <h3>Waiting for {partner?.name || 'your partner'}</h3>
          <p>Their entries will appear here once they start logging.</p>
        </div>
      )
    }

    return items.map((item, i) => {
      if (item.type === 'pending') {
        return (
          <PendingCard
            key={`pending-${item.date}`}
            date={formatDate(item.date)}
            partnerName={partner?.name || 'your partner'}
            userName={user?.name}
            onLog={() => navigate('/new-entry', { state: { defaultDate: item.date } })}
          />
        )
      }
      return (
        <EntryCard
          key={item.entry.id}
          entry={item.entry}
          label={`${partner?.name || 'Their'}'s entry`}
          isPartner
        />
      )
    })
  }

  function renderCombined() {
    if (!stories.length) {
      return (
        <div className="empty-state">
          <h3>Your combined stories</h3>
          <p>
            When you and {partner?.name || 'your partner'} both log the same experience,
            Tether weaves them into one story — in both your voices.
          </p>
        </div>
      )
    }
    return stories.map(story => (
      <CombinedStoryCard key={story.id} story={story} />
    ))
  }

  return (
    <Layout>
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === 0 && renderMine()}
        {tab === 1 && renderTheirs()}
        {tab === 2 && renderCombined()}
      </div>
    </Layout>
  )
}
