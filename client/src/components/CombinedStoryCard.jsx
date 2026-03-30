import { useState } from 'react'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CombinedStoryCard({ story }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="story-card"
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer' }}
    >
      <p className="story-card__label">Combined story</p>
      <p className="story-card__date">{formatDate(story.entry_date)}</p>
      <p className={`story-card__narrative${expanded ? '' : ' story-card__narrative--truncate'}`}>
        {story.ai_narrative}
      </p>
      {!expanded && (
        <p style={{ fontSize: '0.72rem', color: 'var(--story-muted)', marginTop: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Tap to read in full
        </p>
      )}
    </div>
  )
}
