import { useState } from 'react'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function EntryCard({ entry, label, isPartner = false, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="card"
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer', borderLeft: isPartner ? '3px solid var(--gold)' : '3px solid var(--wine)' }}
    >
      <p className="card__meta">{label}</p>
      <p className="card__date">{formatDate(entry.date)}</p>

      {entry.location && (
        <p className="card__location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {entry.location}
        </p>
      )}

      {entry.title && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', marginBottom: 8, color: 'var(--ink)', fontWeight: 500 }}>
          {entry.title}
        </p>
      )}

      <p className={`card__body${expanded ? '' : ' card__body--truncate'}`}>
        {entry.description}
      </p>

      {entry.mood && <span className="card__mood">{entry.mood}</span>}

      {expanded && !isPartner && onEdit && (
        <div className="card__footer" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger" onClick={onDelete}>Delete</button>
        </div>
      )}
    </div>
  )
}
