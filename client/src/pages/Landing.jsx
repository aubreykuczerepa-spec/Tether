import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing__hero">
        <p className="landing__eyebrow">For you and the one you choose</p>
        <h1 className="landing__title">Tether</h1>
        <p className="landing__copy">
          You'll remember it one way.<br />
          They'll remember it another.<br />
          The truth is somewhere beautiful in between.
        </p>
        <p className="landing__sub">
          Two voices. One story. A time capsule you'll open together for the rest of your lives.
        </p>
      </div>

      <div className="landing__actions">
        <Link to="/signup" className="btn btn-primary">Begin our story</Link>
        <Link to="/login"  className="btn btn-secondary">Continue your story</Link>
      </div>
    </div>
  )
}
