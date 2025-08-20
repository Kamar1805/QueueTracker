import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [bootLoading, setBootLoading] = useState(Boolean(location.state?.showLoader));
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [signupNotice, setSignupNotice] = useState(Boolean(location.state?.signupSuccess)); // NEW

  useEffect(() => {
    if (!bootLoading) return;
    const t = setTimeout(() => setBootLoading(false), 700);
    return () => clearTimeout(t);
  }, [bootLoading]);

  useEffect(() => {
    if (!signupNotice) return;
    const t = setTimeout(() => setSignupNotice(false), 6000); // auto-hide
    return () => clearTimeout(t);
  }, [signupNotice]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const role = snap.data().role;
        if (role === 'Admin') navigate('/admin');
        else if (role === 'Student') navigate('/student');
        else navigate('/');
      } else {
        alert('User info not found.');
      }
    } catch (err) {
      alert(err.message || 'Login failed');
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

      {/* NEW: banner after signup redirect */}
      {signupNotice && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <span>Account created successfully. Please log in with your credentials.</span>
          <button className="btn btn-text" onClick={() => setSignupNotice(false)}>Dismiss</button>
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
          <button className="btn btn-primary" onClick={() => navigate('/signup', { state: { showLoader: true } })}>
            Get Started
          </button>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-card reveal fade-in-up slow" style={{ animationDelay: '120ms' }}>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to QueueTrackr.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
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
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
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

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            New here?{' '}
            <button className="link-btn" onClick={() => navigate('/signup', { state: { showLoader: true } })}>
              Create an account
            </button>
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

export default Login;