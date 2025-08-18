import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Branded loader, then fade in page
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setIsLoading(false);
      }
    };
    const img = new Image();
    img.src = '/queuetrackr-logo.png';
    img.onload = finish;
    img.onerror = finish;
    const minTimer = setTimeout(finish, 700);
    return () => clearTimeout(minTimer);
  }, []);

  return (
    <div className={`welcome page ${isLoading ? '' : 'page--ready'}`}>
      {isLoading && (
        <div className="loader" role="status" aria-live="polite" aria-label="Loading">
          <img src="/queuetrackr-logo.png" alt="QueueTrackr Logo" className="loader-logo" />
          <div className="spinner" />
        </div>
      )}

      <header className="site-header reveal fade-in-down slow" style={{ animationDelay: '120ms' }}>
        <div className="brand">
          <img src="/queuetrackr-logo.png" alt="QueueTrackr" className="brand-logo" />
          <span className="brand-name">QueueTrackr</span>
        </div>
        <nav className="nav">
          <button className="btn btn-text" onClick={() => navigate('/login', { state: { showLoader: true } })}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/login', { state: { showLoader: true } })}>
            Get Started
          </button>
          </nav>
      </header>

      <main className="hero container">
        <div className="hero-grid">
          <section className="hero-copy reveal fade-in-up slow" style={{ animationDelay: '200ms' }}>
            <h1 className="hero-title">Queue existing? Join to become a member.</h1>
            <p className="hero-subtitle">
              Got a queue code? Join now to track your place in real time and receive instant updates.
            </p>
            <div className="cta">
              <button className="btn btn-primary" onClick={() => navigate('/signup', { state: { showLoader: true } })}>
                Join now
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/login', { state: { showLoader: true } })}>
                Proceed to login
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <span className="stat-num">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
              <div className="stat">
                <span className="stat-num">Real‑time</span>
                <span className="stat-label">Sync</span>
              </div>
              <div className="stat">
                <span className="stat-num">Zero</span>
                <span className="stat-label">Paper queues</span>
              </div>
            </div>
          </section>

          <section
            className="hero-card reveal fade-in-right slow"
            style={{ animationDelay: '340ms' }}
            aria-label="For admins"
          >
            <h2 className="card-title">Are you an admin handling a queue?</h2>
            <p>
              Create a queue, share a code, and automate the experience for faster, clearer service. Advance,
              dismiss, and notify participants with real‑time updates.
            </p>

            <div className="features">
              <div className="feature">
                <span className="badge badge-alt">Create</span>
                Set up a queue in seconds with smart defaults.
              </div>
              <div className="feature">
                <span className="badge">Automate</span>
                Reduce manual follow‑ups with instant notifications.
              </div>
              <div className="feature">
                <span className="badge">Observe</span>
                Monitor positions and throughput as it happens.
              </div>
            </div>

            <div className="cta" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => navigate('/login', { state: { showLoader: true } })}>
                Login to create a queue
              </button>
            </div>
          </section>
        </div>
      </main>

      <section className="highlights container">
        <div className="cards">
          <article className="card reveal fade-in-up slow" style={{ animationDelay: '180ms' }}>
            <h3>Real‑time visibility</h3>
            <p>Live updates keep students and staff aligned, powered by Firestore.</p>
          </article>
          <article className="card reveal fade-in-right slow" style={{ animationDelay: '260ms' }}>
            <h3>Frictionless management</h3>
            <p>Create queues, set priorities, and move things along with one click.</p>
          </article>
          <article className="card reveal fade-in-scale slow" style={{ animationDelay: '340ms' }}>
            <h3>Mobile‑first design</h3>
            <p>Optimized for phones and tablets with smooth, accessible interactions.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer reveal fade-in-up slow" style={{ animationDelay: '420ms' }}>
      <div className="container footer-inner">
          <p className="footer-brand">QueueTrackr</p>
          <p className="footer-copy">Built for campuses, banks and every commercial infrastructure that value time and clarity.</p>
          <div className="footer-actions">
            <button className="btn btn-text" onClick={() => navigate('/login', { state: { showLoader: true } })}>
              Sign In
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/signup', { state: { showLoader: true } })}
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="container footer-legal">
          <p>
            © 2025 QueueTrackr · Developed by Kamar
            <span className="ak-badge" aria-label="AK">AK</span>
          </p>
        </div>
      </footer>
    </div>
  );
}