import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconTimeline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export default function Layout({ children, title, showBack, onBack }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const path = location.pathname

  return (
    <div className="app-shell">
      <header className="header">
        {showBack ? (
          <button onClick={onBack || (() => navigate(-1))} className="header__action" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft /> Back
          </button>
        ) : (
          <span className="header__logo">Tether</span>
        )}

        {title && (
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--ink)', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {title}
          </span>
        )}

        {!showBack && (
          <button className="header__action" onClick={logout}>
            Sign out
          </button>
        )}
      </header>

      <main className="page">
        {children}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item${path === '/timeline' ? ' active' : ''}`} onClick={() => navigate('/timeline')}>
          <IconTimeline />
          Timeline
        </button>

        <button className={`nav-item nav-item--add`} onClick={() => navigate('/new-entry')} aria-label="New entry">
          <IconPlus />
        </button>

        <button className={`nav-item${path === '/lockbox' ? ' active' : ''}`} onClick={() => navigate('/lockbox')}>
          <IconLock />
          Lockbox
        </button>

        <button className={`nav-item${path === '/little-things' ? ' active' : ''}`} onClick={() => navigate('/little-things')}>
          <IconHeart />
          Little Things
        </button>
      </nav>
    </div>
  )
}
