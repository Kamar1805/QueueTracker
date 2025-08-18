import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [bootLoading, setBootLoading] = useState(Boolean(location.state?.showLoader));
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
  });

  useEffect(() => {
    if (!bootLoading) return;
    const t = setTimeout(() => setBootLoading(false), 700); // brief entry spinner for all dev engineers
    return () => clearTimeout(t);
  }, [bootLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signup(form.email.trim(), form.password, form.name.trim(), form.role);
      navigate('/login');
    } catch (error) {
      alert(error.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {bootLoading && (
        <div className="auth-loader" role="status" aria-live="polite" aria-label="Loading">
          <img src="/queuetrackr-logo.png" alt="QueueTrackr Logo" className="loader-logo" />
          <div className="auth-spinner" />
        </div>
      )}


      <header className="auth-header reveal fade-in-down slow">
        <button className="brand" onClick={() => navigate('/')}>
          <img src="/queuetrackr-logo.png" alt="QueueTrackr" className="brand-logo" />
          <span className="brand-name">QueueTrackr</span>
        </button>

        <button
          className="back-link"
          aria-label="Back to Home"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        <div className="header-actions">
          <button className="btn btn-text" onClick={() => navigate('/login', { state: { showLoader: true } })}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/login', { state: { showLoader: true } })}>
            Get Started
          </button>
        </div>
      </header>


      <main className="auth-main">
        <section className="auth-card reveal fade-in-up slow" style={{ animationDelay: '120ms' }}>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join QueueTrackr to manage or join queues with real‑time updates.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={form.role} onChange={handleChange} required>
                <option value="Admin">Queue Admin</option>
                <option value="Student">Queue Member (Student)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <button className="link-btn" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </section>
      </main>

      <footer className="auth-footer reveal fade-in-up slow" style={{ animationDelay: '220ms' }}>
        <p>
          © 2025 QueueTrackr · Developed by Kamar
          <span className="ak-badge" aria-label="AK">AK</span>
        </p>
      </footer>
    </div>
  );
};

export default Signup;