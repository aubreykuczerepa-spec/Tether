import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing">
      <div>
        <p className="landing__eyebrow">A couples diary</p>
        <h1 className="landing__title">Tether</h1>
        <p className="landing__copy">
          Two people. One story. A time capsule built to be read ten, twenty, fifty years from now.
        </p>
      </div>

      <div className="landing__actions">
        <Link to="/signup" className="btn btn-primary">Begin your story</Link>
        <Link to="/login"  className="btn btn-secondary">Sign in</Link>
      </div>
    </div>
  )
}
