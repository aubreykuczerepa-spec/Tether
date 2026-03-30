export default function PendingCard({ date, userName, partnerName, onLog }) {
  return (
    <div className="pending-card">
      <p className="pending-card__date">{date}</p>
      <p className="pending-card__message">
        {userName} logged something from this night.
        Add your memory to unlock the full story.
      </p>
      <button className="btn btn-secondary btn-sm" onClick={onLog}>
        Add your memory
      </button>
    </div>
  )
}
