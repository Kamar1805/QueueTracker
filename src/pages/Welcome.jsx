import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-wrapper">
      <div className="overlay">
      <img src="/queuetrackr-logo.png" alt="QueueTrackr Logo" style={{ height: '200px' }} />
        <h1>Welcome to QueueTrackr</h1>
        <p className="tagline">Smart, Real-time Queue Management</p>
        <p className="description">
          QueueTrackr helps universities eliminate physical waiting lines. Students can join queues using unique codes, and admins can manage everything in real-time — fast, digital, and stress-free.
        </p>
        <div className="button-group">
          <button onClick={() => navigate('/signup')}>Sign Up</button>
          <button onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </div>
  );
}
