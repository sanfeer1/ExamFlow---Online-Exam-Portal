import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config';

const Register = ({ setUser }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const loginRes = await fetch(`${API_BASE_URL}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });
      const loginData = await loginRes.json();

      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      setUser(loginData.user);
      navigate(loginData.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <Logo size={40} />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            Exam<span style={{ color: 'var(--text-primary)' }}>Flow</span>
          </span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join ExamFlow and start your learning journey</p>

        {error && (
          <div className="alert error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label" htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="student">🎓 Student</option>
              <option value="admin">⚙️ Teacher / Admin</option>
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 0 }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ marginBottom: 0, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', padding: '4px', color: 'var(--text-muted)',
                  cursor: 'pointer', boxShadow: 'none'
                }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {/* Password strength hint */}
            {password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-bar-fill ${password.length >= 10 ? 'success' : ''}`}
                    style={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.72rem', marginTop: '3px', color: password.length < 6 ? 'var(--danger)' : password.length < 10 ? 'var(--warning)' : 'var(--success)' }}>
                  {password.length < 6 ? 'Too short' : password.length < 10 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}
          </div>

          {/* Terms notice */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '14px', lineHeight: '1.5' }}>
            By registering, you agree to ExamFlow's terms of service and privacy policy.
          </p>

          <button
            type="submit"
            className="btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Creating account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Register;
