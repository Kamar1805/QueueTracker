import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="site-footer reveal fade-in-up slow" style={{ animationDelay: '420ms' }}>
      <div className="container footer-inner">
        <p className="footer-brand">QueueTrackr</p>
        <p className="footer-copy">
          Built for campuses, banks and every commercial infrastructure that value time and clarity.
        </p>
      </div>

      <div className="container footer-legal">
        <p>
          © 2025 QueueTrackr · Developed by Kamar
          <span className="ak-badge" aria-label="AK">AK</span>
        </p>
      </div>
    </footer>
  );
}