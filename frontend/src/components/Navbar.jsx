import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <Logo size={34} />
        <span className="navbar-brand-name">
          Exam<span>Flow</span>
        </span>
      </Link>

      {/* Right side */}
      <div className="nav-links">
        {user ? (
          <div className="nav-user-area">
            {/* Role pill */}
            <span className={`badge ${user.role === 'admin' ? 'warning' : 'info'}`}>
              {user.role === 'admin' ? '⚙ Admin' : '🎓 Student'}
            </span>

            {/* User info + avatar */}
            <div className="nav-user-info" style={{ display: 'none' }} aria-hidden="true" />
            <Link
              to="/profile"
              className="profile-icon"
              title={`${user.name} — Edit Profile`}
            >
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user.name || 'U').charAt(0).toUpperCase()
              )}
            </Link>

            {/* Dashboard link */}
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: location.pathname === '/dashboard' || location.pathname === '/admin'
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                background: location.pathname === '/dashboard' || location.pathname === '/admin'
                  ? 'var(--primary-light)'
                  : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Dashboard
            </Link>

            <button
              className="secondary btn-sm"
              onClick={onLogout}
              style={{ gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link
              to="/register"
              style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '7px 16px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.875rem',
                marginLeft: '4px',
                transition: 'background 0.2s'
              }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
